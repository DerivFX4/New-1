import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import 'blockly/msg/en';
import './derivBotBuilder.css';

const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    { kind: 'category', name: 'Trade', colour: '#4b7bec', contents: [
      { kind: 'block', type: 'trade_purchase' },
      { kind: 'block', type: 'trade_contract' },
      { kind: 'block', type: 'trade_sell' },
    ]},
    { kind: 'category', name: 'Market', colour: '#20bf6b', contents: [
      { kind: 'block', type: 'market_volatility' },
      { kind: 'block', type: 'market_tick' },
    ]},
    { kind: 'category', name: 'Logic', colour: '#f7b731', contents: [
      { kind: 'block', type: 'controls_if' },
      { kind: 'block', type: 'logic_compare' },
      { kind: 'block', type: 'logic_operation' },
      { kind: 'block', type: 'logic_boolean' },
    ]},
    { kind: 'category', name: 'Math', colour: '#a55eea', contents: [
      { kind: 'block', type: 'math_number' },
      { kind: 'block', type: 'math_arithmetic' },
    ]},
    { kind: 'category', name: 'Variables', custom: 'VARIABLE', colour: '#eb3b5a' },
  ],
};

function registerBlocks() {
  if (Blockly.Blocks.trade_purchase) return;
  Blockly.Blocks.trade_purchase = { init() {
    this.appendDummyInput().appendField('Purchase contract');
    this.appendValueInput('AMOUNT').setCheck('Number').appendField('stake');
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour('#4b7bec'); this.setTooltip('Request a proposal and purchase the selected contract.');
  }};
  Blockly.Blocks.trade_contract = { init() {
    this.appendDummyInput().appendField('Contract');
    this.appendDummyInput().appendField('duration').appendField(new Blockly.FieldNumber(5, 1, 1000, 1), 'DURATION').appendField('ticks');
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour('#4b7bec');
  }};
  Blockly.Blocks.trade_sell = { init() {
    this.appendDummyInput().appendField('Sell contract');
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour('#4b7bec');
  }};
  Blockly.Blocks.market_volatility = { init() {
    this.appendDummyInput().appendField('Volatility').appendField(new Blockly.FieldDropdown([
      ['Volatility 10','R_10'], ['Volatility 10 1s','1HZ10V'], ['Volatility 15 1s','1HZ15V'],
      ['Volatility 25','R_25'], ['Volatility 25 1s','1HZ25V'], ['Volatility 30 1s','1HZ30V'],
      ['Volatility 50','R_50'], ['Volatility 50 1s','1HZ50V'], ['Volatility 75','R_75'],
      ['Volatility 75 1s','1HZ75V'], ['Volatility 100','R_100'], ['Volatility 100 1s','1HZ100V'],
    ]), 'SYMBOL');
    this.setOutput(true, 'String'); this.setColour('#20bf6b');
  }};
  Blockly.Blocks.market_tick = { init() {
    this.appendDummyInput().appendField('Last tick'); this.setOutput(true, 'Number'); this.setColour('#20bf6b');
  }};
}

export default function DerivBotBuilder({ onRun, onStop }) {
  const ref = useRef(null); const workspace = useRef(null);
  useEffect(() => {
    registerBlocks();
    workspace.current = Blockly.inject(ref.current, { toolbox: TOOLBOX, trashcan: true, scrollbars: true, sounds: false, grid: { spacing: 20, length: 3, colour: '#d7dce5', snap: true }, zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 1.5, minScale: 0.5 } });
    const start = workspace.current.newBlock('trade_purchase'); start.initSvg(); start.render(); start.setFieldValue('1', 'AMOUNT'); start.moveBy(80, 70);
    return () => workspace.current?.dispose();
  }, []);
  const run = () => { const xml = Blockly.utils.xml.workspaceToDom(workspace.current); onRun?.(Blockly.Xml.domToText(xml)); };
  return <section className="deriv-builder"><div className="builder-head"><div><h2>Bot Builder</h2><span>Deriv-style block workspace</span></div><div className="builder-actions"><button onClick={() => workspace.current?.cleanUp()}>Arrange</button><button className="builder-run" onClick={run}>▶ Run bot</button><button onClick={onStop}>■ Stop</button></div></div><div className="builder-note">Drag blocks from the categories, connect them like Deriv Bot, choose the Volatility market inside the Market blocks, then run the strategy.</div><div ref={ref} className="blockly-host" /></section>;
}
