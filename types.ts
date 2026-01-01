
export interface TeamStats {
  name: string;
  pace_season: number;
  pace_l10: number;
  ortg_season: number;
  ortg_l10: number;
  drtg_season: number;
  drtg_l10: number;
  
  tov_pct_off: number;
  tov_pct_def_forced: number;
  oreb_pct_off: number;
  oreb_pct_def_allowed: number;
  ftr_off: number;
  ftr_def_allowed: number;
  efg_pct_off: number;
  efg_pct_def_allowed: number;

  paint_fga: number;
  paint_fg_pct: number;
  pitp: number;
  opp_paint_fga_allowed: number;
  opp_paint_fg_pct_allowed: number;
  opp_pitp_allowed: number;

  three_pa: number;
  opp_three_pa_allowed: number;
  corner_three_mismatch: 'none' | 'medium' | 'strong';
  ast_pct_off: number;
  opp_ast_pct_allowed: number;

  transition_reliance: boolean;
  transition_defense_bleed: boolean;
  
  rest_modifier: 'none' | 'b2b' | '3-in-4';
  missing_rim_protector: boolean;
  missing_primary_creator: boolean;
  fatigue_level: 'none' | 'tired_offense' | 'tired_defense';
  ft_accuracy_pct: number;
}

export interface MarketData {
  total: number;
  spread: number; 
  ml_a: number;
  ml_b: number;
  tt_a: number;
  tt_b: number;
}

export interface LeagueConstants {
  tov_lg_avg: number;
  ftr_avg: number;
  oreb_avg: number;
  three_pa_avg: number;
}

export interface ProjectionResults {
  p_final: number;
  ppp_a: number;
  ppp_b: number;
  pts_a: number;
  pts_b: number;
  total_proj: number;
  margin_final: number;
  edge_total: number;
  edge_spread: number;
  edge_tt_a: number;
  edge_tt_b: number;
  ml_lean: string;
  ml_edge: number;
  breakdown: {
    possessions: {
      p_control: number;
      dp_tov: number;
      dp_ft: number;
      tov_game: number;
      ftr_game: number;
    };
    ppp_a_mods: Record<string, number>;
    ppp_b_mods: Record<string, number>;
    market_comp: {
      spread_proj: number;
      total_proj: number;
    };
  };
  triggers: {
    total: boolean;
    spread: boolean;
    tt_a: boolean;
    tt_b: boolean;
    ml: boolean;
  };
}
