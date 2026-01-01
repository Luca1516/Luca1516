
import { TeamStats, MarketData, LeagueConstants, ProjectionResults } from '../types';

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

const normDec = (val: number) => (val > 1 ? val / 100 : val);
const normPct = (val: number) => (val > 0 && val < 1 ? val * 100 : val);

export const calculateProjections = (
  teamA: TeamStats,
  teamB: TeamStats,
  market: MarketData,
  constants: LeagueConstants
): ProjectionResults => {
  // 1) POSSESSIONS (P_final)
  const paceA = 0.70 * teamA.pace_season + 0.30 * teamA.pace_l10;
  const paceB = 0.70 * teamB.pace_season + 0.30 * teamB.pace_l10;
  
  const slow = Math.min(paceA, paceB);
  const fast = Math.max(paceA, paceB);
  const diff = fast - slow;
  
  let w_slow = 0.5;
  if (diff >= 3.0) w_slow = 0.6;
  else if (diff >= 1.5) w_slow = 0.55;
  
  const p_control = w_slow * slow + (1 - w_slow) * fast;
  
  // TOV_A_exp is Team A's turnovers based on their offense and Team B's defense
  const tov_a_exp = (normPct(teamA.tov_pct_off) + normPct(teamB.tov_pct_def_forced)) / 2;
  const tov_b_exp = (normPct(teamB.tov_pct_off) + normPct(teamA.tov_pct_def_forced)) / 2;
  const tov_game = (tov_a_exp + tov_b_exp) / 2;
  const dp_tov = 0.60 * (tov_game - normPct(constants.tov_lg_avg));
  
  const ftr_a_exp = (normDec(teamA.ftr_off) + normDec(teamB.ftr_def_allowed)) / 2;
  const ftr_b_exp = (normDec(teamB.ftr_off) + normDec(teamA.ftr_def_allowed)) / 2;
  const ftr_game = (ftr_a_exp + ftr_b_exp) / 2;
  const dp_ft = -1.0 * ((ftr_game - normDec(constants.ftr_avg)) / 0.050);
  
  const p_final = clamp(p_control + dp_tov + dp_ft, 85, 120);

  // 2) BASE PPP
  const ortgA = 0.7 * teamA.ortg_season + 0.3 * teamA.ortg_l10;
  const drtgA = 0.7 * teamA.drtg_season + 0.3 * teamA.drtg_l10;
  const ortgB = 0.7 * teamB.ortg_season + 0.3 * teamB.ortg_l10;
  const drtgB = 0.7 * teamB.drtg_season + 0.3 * teamB.drtg_l10;
  
  const ppp_a_raw = ((ortgA + drtgB) / 2) / 100;
  const ppp_b_raw = ((ortgB + drtgA) / 2) / 100;

  // 3) PPP ADJUSTMENTS
  // Anchoring all adjustments to league averages prevents the "Bad Team Paradox"
  const calcTeamPPPMods = (off: TeamStats, def: TeamStats, exp_tov: number, exp_ftr: number) => {
    const mods: Record<string, number> = {};
    
    // Turnovers: Every 1% above league average turns the ball over more = less efficiency
    mods.tov = -0.011 * (exp_tov - normPct(constants.tov_lg_avg));
    
    // Free throws: Every 0.050 above league average FTr = more efficiency
    mods.ft = +0.020 * ((exp_ftr - normDec(constants.ftr_avg)) / 0.050);
    
    const oreb_exp = (normPct(off.oreb_pct_off) + normPct(def.oreb_pct_def_allowed)) / 2;
    mods.oreb = +0.012 * ((oreb_exp - normPct(constants.oreb_avg)) / 3.0);
    
    const dpaint_fga = off.paint_fga - def.opp_paint_fga_allowed;
    const dpaint_fg_pct = (normPct(off.paint_fg_pct) - normPct(def.opp_paint_fg_pct_allowed)) / 100;
    const dpitp = off.pitp - def.opp_pitp_allowed;
    
    const paint_vol = 0.010 * (dpaint_fga / 4);
    const paint_eff = 0.012 * (dpaint_fg_pct / 0.05);
    const paint_pitp = 0.010 * (dpitp / 6);
    
    let paint_cap = 0.035;
    if (def.missing_rim_protector) paint_cap = 0.045;
    mods.paint = clamp(paint_vol + paint_eff + paint_pitp, -paint_cap, paint_cap);
    
    const d_3pa_val = 0.012 * ((off.three_pa - def.opp_three_pa_allowed) / 6);
    let d_corner = 0;
    if (off.corner_three_mismatch === 'medium') d_corner = 0.007;
    if (off.corner_three_mismatch === 'strong') d_corner = 0.012;
    mods.three_pt = clamp(d_3pa_val + d_corner, -0.025, 0.025);
    
    const ast_exp = (normPct(off.ast_pct_off) + normPct(def.opp_ast_pct_allowed)) / 2;
    // Compared to league standard of 60%
    mods.ast = 0.010 * ((ast_exp - 60.0) / 3.0);
    
    let d_trans = 0;
    if (off.transition_reliance && !def.transition_defense_bleed) d_trans -= 0.015;
    if (def.transition_defense_bleed) d_trans += 0.015;
    mods.transition = d_trans;

    let d_extra = 0;
    if (def.opp_three_pa_allowed > normPct(constants.three_pa_avg) + 2) d_extra += 0.005; 
    if (off.fatigue_level === 'tired_offense') d_extra -= 0.006;
    if (def.fatigue_level === 'tired_defense') d_extra += 0.008;
    mods.extra = d_extra;

    return mods;
  };

  const modsA = calcTeamPPPMods(teamA, teamB, tov_a_exp, ftr_a_exp);
  const modsB = calcTeamPPPMods(teamB, teamA, tov_b_exp, ftr_b_exp);

  // We add mods to raw ppp (which is already close to league avg)
  const ppp_a_final = clamp(ppp_a_raw + Object.values(modsA).reduce((a, b) => a + b, 0), 0.75, 1.55);
  const ppp_b_final = clamp(ppp_b_raw + Object.values(modsB).reduce((a, b) => a + b, 0), 0.75, 1.55);

  let pts_a = p_final * ppp_a_final;
  let pts_b = p_final * ppp_b_final;

  const margin_base = pts_a - pts_b;
  
  const fga_a = p_final * (1 - (tov_a_exp / 100));
  const fga_b = p_final * (1 - (tov_b_exp / 100));
  const fta_a = fga_a * ftr_a_exp;
  const fta_b = fga_b * ftr_b_exp;
  
  const ft_pts_a = fta_a * (normPct(teamA.ft_accuracy_pct) / 100);
  const ft_pts_b = fta_b * (normPct(teamB.ft_accuracy_pct) / 100);
  const ft_point_margin = ft_pts_a - ft_pts_b;
  
  let clutch_weight = 0;
  const abs_margin = Math.abs(margin_base);
  if (abs_margin <= 4) clutch_weight = 0.30;
  else if (abs_margin <= 7.5) clutch_weight = 0.15;
  
  const ft_margin_adj = ft_point_margin * clutch_weight;
  const margin_final = margin_base + ft_margin_adj;

  let total_adj = 0;
  const abs_final_margin = Math.abs(margin_final);
  if (abs_final_margin <= 4) total_adj += 3.0;
  else if (abs_final_margin <= 7.5) total_adj += 1.5;
  if (abs_final_margin >= 10) total_adj -= 2.0;
  
  const total_proj = pts_a + pts_b + total_adj;

  const edge_total = total_proj - market.total;
  const edge_spread = -(margin_final + market.spread); 
  const edge_tt_a = pts_a - market.tt_a;
  const edge_tt_b = pts_b - market.tt_b;

  const win_prob_a = 0.5 + (margin_final * 0.031); 
  const implied_prob_a = market.ml_a < 0 ? (-market.ml_a / (-market.ml_a + 100)) : (100 / (market.ml_a + 100));
  const ml_edge = win_prob_a - implied_prob_a;

  return {
    p_final,
    ppp_a: ppp_a_final,
    ppp_b: ppp_b_final,
    pts_a,
    pts_b,
    total_proj,
    margin_final,
    edge_total,
    edge_spread,
    edge_tt_a,
    edge_tt_b,
    ml_lean: ml_edge > 0.04 ? teamA.name : (ml_edge < -0.04 ? teamB.name : 'No Lean'),
    ml_edge,
    breakdown: {
      possessions: {
        p_control,
        dp_tov,
        dp_ft,
        tov_game,
        ftr_game
      },
      ppp_a_mods: modsA,
      ppp_b_mods: modsB,
      market_comp: {
        spread_proj: -margin_final,
        total_proj
      }
    },
    triggers: {
      total: Math.abs(edge_total) >= 3.0,
      spread: Math.abs(edge_spread) >= 2.0,
      tt_a: Math.abs(edge_tt_a) >= 2.5,
      tt_b: Math.abs(edge_tt_b) >= 2.5,
      ml: Math.abs(ml_edge) >= 0.04
    }
  };
};
