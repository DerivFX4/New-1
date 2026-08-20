import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import 'blockly/msg/en';
import './derivBotBuilder.css';

const VOLATILITIES=[['Volatility 10','R_10'],['Volatility 10 1s','1HZ10V'],['Volatility 15 1s','1HZ15V'],['Volatility 25','R_25'],['Volatility 25 1s','1HZ25V'],['Volatility 30 1s','1HZ30V'],['Volatility 50','R_50'],['Volatility 50 1s','1HZ50V'],['Volatility 75','R_75'],['Volatility 75 1s','1HZ75V'],['Volatility 100','R_100'],['Volatility 100 1s','1HZ100V']];
const CONTRACTS=[['Differs','DIGITDIFF'],['Matches','DIGITMATCH'],['Over','DIGITOVER'],['Under','DIGITUNDER'],['Even','DIGITEVEN'],['Odd','DIGITODD'],['Rise','CALL'],['Fall','PUT']];
const TYPES=['digit_strategy','digit_contract','digit_barrier','digit_stake','digit_duration','digit_recovery'];
function fieldBlock(type,label,colour,fields=[],output=false){Blockly.Blocks[type]={init(){this.appendDummyInput().appendField(label);fields.forEach(([name,opts])=>this.appendDummyInput().appendField(opts instanceof Array&&opts.every(x=>Array.isArray(x))?new Blockly.FieldDropdown(opts):new Blockly.FieldNumber(Number(opts??1),0,999999,1),name));if(output)this.setOutput(true);else{this.setPreviousStatement(true);this.setNextStatement(true);}this.setColour(colour);}};}
function registerBlocks(){
 if(Blockly.Blocks.digit_strategy)return;
 fieldBlock('digit_strategy','Digit strategy','#3867d6',[['SYMBOL',VOLATILITIES]],false);
 fieldBlock('digit_contract','Contract type','#3867d6',[['CONTRACT',CONTRACTS]],false);
 fieldBlock('digit_barrier','Barrier / digit','#3867d6',[['BARRIER',1]],false);
 fieldBlock('digit_stake','Stake','#3867d6',[['STAKE',1]],false);
 fieldBlock('digit_duration','Duration (ticks)','#3867d6',[['DURATION',1]],false);
 fieldBlock('digit_recovery','Recovery / next stake','#eb3b5a',[['MULTIPLIER',2]],false);
 fieldBlock('trade_purchase','Purchase contract','#4b7bec',[['AMOUNT',1]],false);
 fieldBlock('trade_sell','Sell contract','#4b7bec',[],false);
 Blockly.Blocks.market_tick={init(){this.appendDummyInput().appendField('Last digit');this.setOutput(true,'Number');this.setColour('#20bf6b');}};
 Blockly.Blocks.digit_result={init(){this.appendDummyInput().appendField('Contract result');this.setOutput(true,'String');this.setColour('#20bf6b');}};
 Blockly.Blocks.digit_compare={init(){this.appendValueInput('LEFT').setCheck('Number').appendField('Digit');this.appendDummyInput().appendField(new Blockly.FieldDropdown([['=','EQ'],['≠','NEQ'],['>','GT'],['<','LT'],['≥','GTE'],['≤','LTE']]),'OP');this.appendValueInput('RIGHT').setCheck('Number');this.setOutput(true,'Boolean');this.setColour('#f7b731');}};
 Blockly.Blocks.recovery_if_loss={init(){this.appendDummyInput().appendField('If loss → multiply stake ×').appendField(new Blockly.FieldNumber(2,1,100,0.1),'MULTIPLIER');this.setPreviousStatement(true);this.setNextStatement(true);this.setColour('#eb3b5a');}};
 Blockly.Blocks.recovery_stop={init(){this.appendDummyInput().appendField('Stop after losses').appendField(new Blockly.FieldNumber(3,1,100,1),'LOSSES');this.setPreviousStatement(true);this.setNextStatement(true);this.setColour('#eb3b5a');}};
}
const TOOLBOX={kind:'categoryToolbox',contents:[
 {kind:'category',name:'Trade',colour:'#4b7bec',contents:[{kind:'block',type:'trade_purchase'},{kind:'block',type:'trade_sell'},{kind:'block',type:'digit_contract'},{kind:'block',type:'digit_barrier'},{kind:'block',type:'digit_stake'},{kind:'block',type:'digit_duration'}]},
 {kind:'category',name:'Digits',colour:'#3867d6',contents:[{kind:'block',type:'digit_strategy'},{kind:'block',type:'market_tick'},{kind:'block',type:'digit_result'},{kind:'block',type:'digit_compare'}]},
 {kind:'category',name:'Recovery',colour:'#eb3b5a',contents:[{kind:'block',type:'digit_recovery'},{kind:'block',type:'recovery_if_loss'},{kind:'block',type:'recovery_stop'}]},
 {kind:'category',name:'Logic',colour:'#f7b731',contents:[{kind:'block',type:'controls_if'},{kind:'block',type:'logic_compare'},{kind:'block',type:'logic_operation'},{kind:'block',type:'logic_boolean'}]},
 {kind:'category',name:'Math',colour:'#a55eea',contents:[{kind:'block',type:'math_number'},{kind:'block',type:'math_arithmetic'}]},
 {kind:'category',name:'Variables',custom:'VARIABLE',colour:'#eb3b5a'}]};
export default function DerivBotBuilder({onRun,onStop}){const ref=useRef(null),workspace=useRef(null);useEffect(()=>{registerBlocks();workspace.current=Blockly.inject(ref.current,{toolbox:TOOLBOX,trashcan:true,scrollbars:true,sounds:false,grid:{spacing:20,length:3,colour:'#d7dce5',snap:true},zoom:{controls:true,wheel:true,startScale:.9,maxScale:1.5,minScale:.5}});const s=workspace.current.newBlock('digit_strategy');s.initSvg();s.render();s.moveBy(80,70);return()=>workspace.current?.dispose();},[]);const run=()=>{const xml=Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace.current));onRun?.(xml);};return <section className="deriv-builder"><div className="builder-head"><div><h2>Bot Builder</h2><span>DBot-style visual strategy blocks</span></div><div className="builder-actions"><button onClick={()=>workspace.current?.cleanUp()}>Arrange</button><button className="builder-run" onClick={run}>▶ Run bot</button><button onClick={onStop}>■ Stop</button></div></div><div className="builder-note">Build connected strategies with Volatility, Digits, contract type, barriers, stake, duration and recovery blocks.</div><div ref={ref} className="blockly-host"/></section>;}
