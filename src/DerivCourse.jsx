import React,{useState} from 'react';
const LESSONS=[
['01','Synthetic Indices Foundations','What synthetic indices are, tick behavior, contract duration, stake, payout and Demo-first practice.'],
['02','Volatility Indices','Volatility 10, 25, 50, 75, 100 and their 1s variants; selecting markets and reading live ticks.'],
['03','Digit Options','Differs, Matches, Over, Under, Even and Odd: contract setup, barriers and settlement.'],
['04','Rise / Fall Options','CALL/Rise and PUT/Fall contracts, duration, entry and settlement.'],
['05','Reading the Last Digit','Current and previous digits, digit comparisons, Even/Odd and Over/Under conditions.'],
['06','Synthetic Options Strategies','How to turn conditions into a repeatable ruleset without assuming a market outcome.'],
['07','Risk & Stake Management','Fixed stake, loss limits, recovery sizing, bankroll discipline and why recovery can increase risk.'],
['08','VintelFX Bot Builder','Build a synthetic-options bot using blocks, live ticks, conditions, recovery and execution flow.'],
['09','Demo Testing','Test authentication, live balance, ticks, proposal, purchase and contract result on Demo before Real.'],
['10','Real Trading Readiness','Checklist for moving from verified Demo execution to Real trading; no guarantee of profit.']
];
export default function DerivCourse(){const [open,setOpen]=useState(null);return <section className="course"><div className="course-head"><div><span className="course-kicker">DERIV COURSE</span><h1>🎓 Synthetic Options Trading</h1><p>Dedicated course for Deriv Synthetic Indices and options contracts. No Forex or traditional markets.</p></div><div className="course-badge">SYNTHETIC · OPTIONS ONLY</div></div><div className="course-warning">⚠️ Educational content only. Trading involves risk. Strategies and recovery methods do not guarantee profit. Practise on Demo first.</div><div className="course-grid">{LESSONS.map((l,i)=><article className={'course-card '+(open===i?'open':'')} key={l[0]}><div className="course-num">{l[0]}</div><div className="course-content"><h2>{l[1]}</h2><p>{l[2]}</p><button onClick={()=>setOpen(open===i?null:i)}>{open===i?'▲ Close Lesson':'▶ Start Lesson'}</button>{open===i&&<div className="course-lesson"><h3>Lesson {l[1]}</h3><p>{l[2]}</p><ul><li>Learn the concept and contract rules.</li><li>Review a practical synthetic-market example.</li><li>Practise the setup in VintelFX using Demo.</li></ul></div>}</div></article>)}</div></section>}
