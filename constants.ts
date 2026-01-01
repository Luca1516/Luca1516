
import { TeamStats, MarketData, LeagueConstants } from './types';

export const DEFAULT_LEAGUE_CONSTANTS: LeagueConstants = {
  tov_lg_avg: 14.5,
  ftr_avg: 0.240,
  oreb_avg: 0.305,
  three_pa_avg: 35.0
};

export const INITIAL_TEAM_STATE = (name: string): TeamStats => ({
  name,
  pace_season: 100,
  pace_l10: 100,
  ortg_season: 115,
  ortg_l10: 115,
  drtg_season: 115,
  drtg_l10: 115,
  tov_pct_off: 14.5,
  tov_pct_def_forced: 14.5,
  oreb_pct_off: 30.5,
  oreb_pct_def_allowed: 30.5,
  ftr_off: 0.24,
  ftr_def_allowed: 0.24,
  efg_pct_off: 54,
  efg_pct_def_allowed: 54,
  paint_fga: 45,
  paint_fg_pct: 65,
  pitp: 50,
  opp_paint_fga_allowed: 45,
  opp_paint_fg_pct_allowed: 65,
  opp_pitp_allowed: 50,
  three_pa: 35,
  opp_three_pa_allowed: 35,
  corner_three_mismatch: 'none',
  ast_pct_off: 60,
  opp_ast_pct_allowed: 60,
  transition_reliance: false,
  transition_defense_bleed: false,
  rest_modifier: 'none',
  missing_rim_protector: false,
  missing_primary_creator: false,
  fatigue_level: 'none',
  ft_accuracy_pct: 78
});

export const INITIAL_MARKET_STATE: MarketData = {
  total: 230,
  spread: 0,
  ml_a: -110,
  ml_b: -110,
  tt_a: 115,
  tt_b: 115
};
