
import React, { useState, useMemo } from 'react';
import { TeamStats, MarketData, LeagueConstants, ProjectionResults } from './types';
import { INITIAL_TEAM_STATE, INITIAL_MARKET_STATE, DEFAULT_LEAGUE_CONSTANTS } from './constants';
import { calculateProjections } from './services/analystEngine';

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-slate-800/50 border border-slate-700 rounded-xl p-5 ${className}`}>
    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-700 pb-2">{title}</h3>
    {children}
  </div>
);

const InputField: React.FC<{ label: string; value: number | string; onChange: (val: any) => void; type?: string; step?: string; unit?: string }> = ({ label, value, onChange, type = "number", step = "0.1", unit }) => (
  <div className="flex flex-col gap-1 mb-3">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</label>
      {unit && <span className="text-[9px] text-slate-600 font-bold">{unit}</span>}
    </div>
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => {
        const val = e.target.value;
        onChange(type === "number" ? (val === "" ? 0 : parseFloat(val)) : val);
      }}
      className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm mono focus:outline-none focus:border-blue-500 transition-colors"
    />
  </div>
);

const SelectField: React.FC<{ label: string; value: string; options: {label: string, value: string}[]; onChange: (val: any) => void }> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1 mb-3">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none"
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

const CheckboxField: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer mb-2">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0 focus:ring-offset-0"
    />
    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{label}</span>
  </label>
);

const EdgeDisplay = ({ label, value, marketVal, trigger }: { label: string, value: number, marketVal: number, trigger: boolean }) => {
  const edge = value - marketVal;
  return (
    <div className={`p-4 rounded-lg border ${trigger ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/30'}`}>
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs font-bold text-slate-400 uppercase">{label}</span>
        {trigger && <span className="bg-emerald-500 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded animate-pulse uppercase">Active Edge</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black mono">{value.toFixed(1)}</span>
        <span className="text-xs text-slate-500 uppercase">vs {marketVal.toFixed(1)}</span>
      </div>
      <div className={`text-sm font-bold mono ${edge >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {edge >= 0 ? '+' : ''}{edge.toFixed(1)}
      </div>
    </div>
  );
};

const TeamInputBlock = ({ side, team, onUpdate }: { side: 'A' | 'B', team: TeamStats, onUpdate: (side: 'A' | 'B', key: keyof TeamStats, value: any) => void }) => (
  <div className="space-y-6">
    <Card title={`${team.name} Fundamentals`}>
      <InputField label="Team Name" type="text" value={team.name} onChange={(v) => onUpdate(side, 'name', v)} />
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <InputField label="Pace (Seas)" value={team.pace_season} onChange={(v) => onUpdate(side, 'pace_season', v)} />
        <InputField label="Pace (L10)" value={team.pace_l10} onChange={(v) => onUpdate(side, 'pace_l10', v)} />
        <InputField label="ORtg (Seas)" value={team.ortg_season} onChange={(v) => onUpdate(side, 'ortg_season', v)} />
        <InputField label="ORtg (L10)" value={team.ortg_l10} onChange={(v) => onUpdate(side, 'ortg_l10', v)} />
        <InputField label="DRtg (Seas)" value={team.drtg_season} onChange={(v) => onUpdate(side, 'drtg_season', v)} />
        <InputField label="DRtg (L10)" value={team.drtg_l10} onChange={(v) => onUpdate(side, 'drtg_l10', v)} />
        <InputField label="TOV% Off" unit="%" value={team.tov_pct_off} onChange={(v) => onUpdate(side, 'tov_pct_off', v)} />
        <InputField label="TOV% Def Frc" unit="%" value={team.tov_pct_def_forced} onChange={(v) => onUpdate(side, 'tov_pct_def_forced', v)} />
        <InputField label="OREB% Off" unit="%" value={team.oreb_pct_off} onChange={(v) => onUpdate(side, 'oreb_pct_off', v)} />
        <InputField label="OREB% Def Allw" unit="%" value={team.oreb_pct_def_allowed} onChange={(v) => onUpdate(side, 'oreb_pct_def_allowed', v)} />
        <InputField label="FTr Off" unit="dec" step="0.001" value={team.ftr_off} onChange={(v) => onUpdate(side, 'ftr_off', v)} />
        <InputField label="FTr Def Allw" unit="dec" step="0.001" value={team.ftr_def_allowed} onChange={(v) => onUpdate(side, 'ftr_def_allowed', v)} />
      </div>
    </Card>
    <Card title={`${team.name} Shot Profile`}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <InputField label="Paint FGA" value={team.paint_fga} onChange={(v) => onUpdate(side, 'paint_fga', v)} />
        <InputField label="Paint FG%" unit="%" value={team.paint_fg_pct} onChange={(v) => onUpdate(side, 'paint_fg_pct', v)} />
        <InputField label="PITP (Paint Pts)" value={team.pitp} onChange={(v) => onUpdate(side, 'pitp', v)} />
        <InputField label="Opp PITP Allw" value={team.opp_pitp_allowed} onChange={(v) => onUpdate(side, 'opp_pitp_allowed', v)} />
        <InputField label="3PA Rate" value={team.three_pa} onChange={(v) => onUpdate(side, 'three_pa', v)} />
        <InputField label="Opp 3PA Allw" value={team.opp_three_pa_allowed} onChange={(v) => onUpdate(side, 'opp_three_pa_allowed', v)} />
        <InputField label="AST% Off" unit="%" value={team.ast_pct_off} onChange={(v) => onUpdate(side, 'ast_pct_off', v)} />
        <InputField label="FT Accuracy %" unit="%" value={team.ft_accuracy_pct} onChange={(v) => onUpdate(side, 'ft_accuracy_pct', v)} />
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
        <CheckboxField label="Missing Rim Prot" checked={team.missing_rim_protector} onChange={(v) => onUpdate(side, 'missing_rim_protector', v)} />
        <CheckboxField label="Trans. Reliant" checked={team.transition_reliance} onChange={(v) => onUpdate(side, 'transition_reliance', v)} />
        <SelectField label="Fatigue State" value={team.fatigue_level} options={[{label: 'Fresh', value: 'none'}, {label: 'Tired Offense', value: 'tired_offense'}, {label: 'Tired Defense', value: 'tired_defense'}]} onChange={(v) => onUpdate(side, 'fatigue_level', v)} />
      </div>
    </Card>
  </div>
);

const App: React.FC = () => {
  const [teamA, setTeamA] = useState<TeamStats>(INITIAL_TEAM_STATE('Team A'));
  const [teamB, setTeamB] = useState<TeamStats>(INITIAL_TEAM_STATE('Team B'));
  const [market, setMarket] = useState<MarketData>(INITIAL_MARKET_STATE);
  const [constants, setConstants] = useState<LeagueConstants>(DEFAULT_LEAGUE_CONSTANTS);

  const results: ProjectionResults = useMemo(() => calculateProjections(teamA, teamB, market, constants), [teamA, teamB, market, constants]);

  const updateTeam = (side: 'A' | 'B', key: keyof TeamStats, value: any) => {
    const setter = side === 'A' ? setTeamA : setTeamB;
    setter(prev => ({ ...prev, [key]: value }));
  };

  const updateMarket = (key: keyof MarketData, value: any) => {
    setMarket(prev => ({ ...prev, [key]: value }));
  };

  const updateConstants = (key: keyof LeagueConstants, value: any) => {
    setConstants(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Elite NBA Analyst <span className="text-slate-600 not-italic font-medium text-base ml-2">v4.3.1</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em]">Independent Shot-Profile & Logic Engine</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase mb-1">Engine Stability</span>
            <div className={`h-1.5 w-24 rounded-full bg-slate-800 overflow-hidden`}>
              <div className={`h-full bg-blue-500 w-full animate-pulse`}></div>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-6 rounded-lg text-sm transition-all border border-slate-700 uppercase tracking-widest"
          >
            Clear Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <TeamInputBlock side="A" team={teamA} onUpdate={updateTeam} />

        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Possession Environment">
              <div className="flex justify-between items-center mb-6">
                <span className="text-4xl font-black mono text-blue-400">{results.p_final.toFixed(1)}</span>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-black">P_FINAL</div>
                  <div className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">Matchup Weighted</div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs mono">
                <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                  <span className="text-slate-500">P_CONTROL (Tempo)</span>
                  <span className="text-slate-300">{results.breakdown.possessions.p_control.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                  <span className="text-slate-500">TOV Influence</span>
                  <span className={`font-bold ${results.breakdown.possessions.dp_tov >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {results.breakdown.possessions.dp_tov >= 0 ? '+' : ''}{results.breakdown.possessions.dp_tov.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                  <span className="text-slate-500">FT Slowdown</span>
                  <span className={`font-bold ${results.breakdown.possessions.dp_ft >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {results.breakdown.possessions.dp_ft >= 0 ? '+' : ''}{results.breakdown.possessions.dp_ft.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Alpha Value Tracking">
              <div className="space-y-4">
                <EdgeDisplay label="Projected Total" value={results.total_proj} marketVal={market.total} trigger={results.triggers.total} />
                <EdgeDisplay label="Projected Margin" value={-results.margin_final} marketVal={market.spread} trigger={results.triggers.spread} />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title={`${teamA.name} Efficiency`}>
              <div className="mb-2">
                <span className="text-2xl font-black mono text-slate-200">{(results.ppp_a).toFixed(3)} <span className="text-xs text-slate-600 font-normal">PPP</span></span>
              </div>
              <div className="space-y-1 text-[11px] mono">
                {Object.entries(results.breakdown.ppp_a_mods).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0">
                    <span className="text-slate-500 uppercase">{key} Impact</span>
                    <span className={`${val >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>
                      {val >= 0 ? '+' : ''}{val.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title={`${teamB.name} Efficiency`}>
              <div className="mb-2">
                <span className="text-2xl font-black mono text-slate-200">{(results.ppp_b).toFixed(3)} <span className="text-xs text-slate-600 font-normal">PPP</span></span>
              </div>
              <div className="space-y-1 text-[11px] mono">
                {Object.entries(results.breakdown.ppp_b_mods).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0">
                    <span className="text-slate-500 uppercase">{key} Impact</span>
                    <span className={`${val >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>
                      {val >= 0 ? '+' : ''}{val.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-8 rounded-2xl border-2 border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="text-center md:text-left">
                <span className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-2 block">System Output: Final Projection</span>
                <div className="flex items-center gap-6 mt-1">
                  <div className="text-center">
                    <span className="text-xs text-slate-500 block uppercase mb-1">{teamA.name}</span>
                    <span className="text-5xl font-black mono text-slate-100">{results.pts_a.toFixed(1)}</span>
                  </div>
                  <span className="text-2xl text-slate-700 font-black mt-4">@</span>
                  <div className="text-center">
                    <span className="text-xs text-slate-500 block uppercase mb-1">{teamB.name}</span>
                    <span className="text-5xl font-black mono text-slate-100">{results.pts_b.toFixed(1)}</span>
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-700 flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Model Total</span>
                    <span className="text-lg font-black mono text-emerald-400">{results.total_proj.toFixed(1)}</span>
                  </div>
                  <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-700 flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Model Margin</span>
                    <span className="text-lg font-black mono text-emerald-400">{(results.margin_final > 0 ? teamA.name : teamB.name)} -{Math.abs(results.margin_final).toFixed(1)}</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-72 space-y-4">
                <div className="bg-slate-900/90 backdrop-blur p-5 rounded-xl border border-slate-700">
                  <h4 className="text-[10px] text-slate-400 uppercase font-black mb-4 border-b border-slate-800 pb-2 flex justify-between">
                    <span>Edge Analysis</span>
                    <span className="text-emerald-500">Live</span>
                  </h4>
                  <div className="space-y-4">
                    {!Object.values(results.triggers).some(v => v) && <div className="text-xs text-slate-600 italic font-medium">No verified market discrepancies detected.</div>}
                    {results.triggers.total && (
                      <div className="flex justify-between items-center group">
                        <span className="text-xs font-black text-slate-300 uppercase">TOTAL {results.edge_total > 0 ? 'OVER' : 'UNDER'}</span>
                        <span className="mono bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black group-hover:scale-110 transition-transform">EDGE {Math.abs(results.edge_total).toFixed(1)}</span>
                      </div>
                    )}
                    {results.triggers.spread && (
                      <div className="flex justify-between items-center group">
                        <span className="text-xs font-black text-slate-300 uppercase">SPREAD {results.edge_spread > 0 ? teamA.name : teamB.name}</span>
                        <span className="mono bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black group-hover:scale-110 transition-transform">EDGE {Math.abs(results.edge_spread).toFixed(1)}</span>
                      </div>
                    )}
                    {results.triggers.ml && (
                      <div className="flex justify-between items-center group">
                        <span className="text-xs font-black text-slate-300 uppercase">ML {results.ml_lean}</span>
                        <span className="mono bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black group-hover:scale-110 transition-transform">{(Math.abs(results.ml_edge) * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TeamInputBlock side="B" team={teamB} onUpdate={updateTeam} />

        <div className="xl:col-span-4 mt-6">
          <Card title="Market Odds & League Constants Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3">Game Lines</h4>
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Game Total" value={market.total} onChange={(v) => updateMarket('total', v)} />
                  <InputField label="Spread (A)" value={market.spread} onChange={(v) => updateMarket('spread', v)} />
                  <InputField label="ML Team A" value={market.ml_a} onChange={(v) => updateMarket('ml_a', v)} />
                  <InputField label="ML Team B" value={market.ml_b} onChange={(v) => updateMarket('ml_b', v)} />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3">Team Totals</h4>
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="TT Team A" value={market.tt_a} onChange={(v) => updateMarket('tt_a', v)} />
                  <InputField label="TT Team B" value={market.tt_b} onChange={(v) => updateMarket('tt_b', v)} />
                </div>
              </div>
              <div className="space-y-1 lg:col-span-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3">League Averages</h4>
                <div className="grid grid-cols-4 gap-2">
                  <InputField label="Avg TOV%" unit="%" value={constants.tov_lg_avg} onChange={(v) => updateConstants('tov_lg_avg', v)} />
                  <InputField label="Avg FTr" unit="dec" value={constants.ftr_avg} onChange={(v) => updateConstants('ftr_avg', v)} />
                  <InputField label="Avg OREB%" unit="%" value={constants.oreb_avg} onChange={(v) => updateConstants('oreb_avg', v)} />
                  <InputField label="Avg 3PA" value={constants.three_pa_avg} onChange={(v) => updateConstants('three_pa_avg', v)} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <footer className="mt-12 pt-8 border-t border-slate-800 text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] flex flex-col md:flex-row justify-between gap-4">
        <div>Proprietary NBA Shot-Profile Matrix v4.3</div>
        <div className="flex gap-6">
          <span>Clamping: ACTIVE</span>
          <span>Focus Fix: DEPLOYED</span>
          <span>Status: CALIBRATED</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
