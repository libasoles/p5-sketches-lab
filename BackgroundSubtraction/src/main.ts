import * as p5 from 'p5' 
import './styles.scss'
import { MainView } from './app/MainView.ts'

// this prevents IDE errors, complaining about unexisting p5 var
declare global {
  var p5: any;
}

// Sketch scope
export function sketch (p) {

  let view;

  // Setup function
  // ======================================
  p.setup = () => {
    let canvas = p.createCanvas(p.displayWidth, p.displayHeight);

    p.frameRate(15);

    // make library globally available
    window["p5"] = p;

    view = new MainView(p);     
  }

  // Draw function
  // ======================================
  p.draw = () => {
    view.display();
  }
}

// Initialize sketch
new p5(sketch);
