import * as P5 from 'p5'
import 'p5/lib/addons/p5.dom';
import * as utils from '../shared/utils.js'
import * as cd from 'color-difference'

export class MainView {

    private p5;
    private capture;
    private w = 640;
    private h = 480;

    private dynamicBg;
    private displayDynamicBg = false; 

    private backgroundPixels;

    private bgColor = new P5.Vector();
    private captureColor = new P5.Vector();
    private helperVector = new P5.Vector();
    private distance = 0;
    private skip;
    private r;
    private g;
    private b;
    private a;

    constructor(p5) {
        this.p5 = p5;

        const canvas = p5.createCanvas(this.w, this.h);
        canvas.parent('canvas-container');

        this.capture = p5.createCapture(p5.VIDEO);        
        this.capture.size(this.w, this.h);
        this.capture.hide();

        const resetBtn = p5.select('.btn-reset');
        resetBtn.mouseClicked(_=>this.resetBackground());

        const startBtn = p5.select('.btn-save');
        startBtn.mouseClicked(_=>this.saveSnap());

        const randomBgBtn = p5.select('.btn-random-bg');
        randomBgBtn.mouseClicked(_=>this.setRandomBg());
    }

    resetBackground() {
        this.backgroundPixels = undefined;
    }

    display() {

        this.p5.background(0);
        this.capture.loadPixels();

        if (this.capture.pixels.length > 0) { // don't forget this!

            // capture background
            if (!this.backgroundPixels) {
                this.backgroundPixels = utils.copyImage(this.capture.pixels, this.backgroundPixels);
            }

            var i = 0;
            var pixels = this.capture.pixels;
            var thresholdAmount = this.p5.select('#thresholdAmount').value();

            this.p5.select('#displayAmount').html(thresholdAmount);

            const thresholdType = utils.getRadioValue('thresholdType');
            const comparisonMethod = utils.getRadioValue('comparisonMethod');

            const alfa = this.dynamicBg !== null ? 0 : 255;

            for (var y = 0; y < this.h; y++) {
                for (var x = 0; x < this.w; x++) {
                
                    this.r = i;
                    this.g = i+1;
                    this.b = i+2;
                    this.a = i+3;

                    this.bgColor.x = this.backgroundPixels[this.r];
                    this.bgColor.y = this.backgroundPixels[this.g];
                    this.bgColor.z = this.backgroundPixels[this.b];

                    this.captureColor.x = pixels[this.r];
                    this.captureColor.y = pixels[this.g];
                    this.captureColor.z = pixels[this.b];
                    
                    if (comparisonMethod === 'lab') {
                        this.distance = compareLab(this.bgColor, this.captureColor);
                    } else if(comparisonMethod === 'euclidean') {
                        this.distance = euclideanDistance(this.bgColor, this.captureColor);
                    } else if(comparisonMethod === 'hsl') {
                        this.distance = compareHSL(this.bgColor, this.captureColor);
                    } else if(comparisonMethod === 'hsv') {
                        this.distance = compareHSV(this.bgColor, this.captureColor);
                    } else {
                        this.distance = compareRGB(this.bgColor, this.captureColor); // rgb
                    }

                    this.skip = (this.distance < thresholdAmount);

                    if (thresholdType === 'bn') {
                        pixels[this.r] = this.skip ? 0 : 255;
                        pixels[this.g] = this.skip ? 0 : 255;
                        pixels[this.b] = this.skip ? 0 : 255;
                        pixels[this.a] = this.skip ? alfa : 255;
                    } else if(thresholdType === 'color') {
                        pixels[this.r] = this.skip ? 0 : pixels[this.r];
                        pixels[this.g] = this.skip ? 0 : pixels[this.g];
                        pixels[this.b] = this.skip ? 0 : pixels[this.b];
                        pixels[this.a] = this.skip ? alfa : pixels[this.a];
                    }

                    i=i+4; // next pixel color 
                }
            }               
            
            if(this.displayDynamicBg) {
                this.p5.image(this.dynamicBg , 0, 0, 640, 480);
            }           
        }
        this.capture.updatePixels();
        
        this.p5.image(this.capture, 0, 0, 640, 480);
    }

    setRandomBg() {        
        const self = this;
        this.dynamicBg = this.p5.createImg("http://lorempixel.com/"+this.w+"/"+this.h+"?hash"+ new Date(), ()=>{ self.displayDynamicBg = true; });
    }

    saveSnap() {
        this.p5.save("snap-"+this.p5.millis()+".jpg");
    }
}

function compareRGB(v1, v2) {
    return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y) + Math.abs(v1.z - v2.z);
}

function compareLab(v1, v2) {
    return deltaE(
            rgb2lab(v1.x, v1.y, v1.z), 
            rgb2lab(v2.x, v2.y, v2.z)
        );
}

function compareHSL(v1, v2) {
    [v1.x, v1.y, v1.z] = rgbToHsl(v1.x, v1.y, v1.z);
    [v2.x, v2.y, v2.z] = rgbToHsl(v2.x, v2.y, v2.z);
    return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y) + Math.abs(v1.z - v2.z);
}

function compareHSV(v1, v2) {
    [v1.x, v1.y, v1.z] = rgbToHsv(v1.x, v1.y, v1.z);
    [v2.x, v2.y, v2.z] = rgbToHsv(v2.x, v2.y, v2.z);
    return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y) + Math.abs(v1.z - v2.z);
}

function rgb2lab(red, green, blue){
  var r = red/ 255,
      g = green / 255,
      b = blue / 255,
      x, y, z;

      r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
      g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
      b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

      x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
      y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
      z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

      x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
      y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
      z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

      return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

// calculate the perceptual distance between colors in CIELAB
// https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs

function deltaE(labA, labB){
  var deltaL = labA[0] - labB[0];
  var deltaA = labA[1] - labB[1];
  var deltaB = labA[2] - labB[2];
  var c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  var c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  var deltaC = c1 - c2;
  var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  var sc = 1.0 + 0.045 * c1;
  var sh = 1.0 + 0.015 * c1;
  var deltaLKlsl = deltaL / (1.0);
  var deltaCkcsc = deltaC / (sc);
  var deltaHkhsh = deltaH / (sh);
  var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [Math.floor(h * 360), Math.floor(s * 100), Math.floor(l * 100)];
}

function rgbToHsv(r, g, b) {
    var
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        delta = max - min,
        h, s, v = max;

    v = Math.floor(max / 255 * 100);
    if ( max != 0 )
        s = Math.floor(delta / max * 100);
    else {
        // black
        return [0, 0, 0];
    }

    if( r == max )
        h = ( g - b ) / delta;         // between yellow & magenta
    else if( g == max )
        h = 2 + ( b - r ) / delta;     // between cyan & yellow
    else
        h = 4 + ( r - g ) / delta;     // between magenta & cyan

    h = Math.floor(h * 60);            // degrees
    if( h < 0 ) h += 360;

    return [h, s, v];
}

function euclideanDistance(v1, v2){
    var d = 0;

    d += (v1.x - v2.x)*(v1.x - v2.x);
    d += (v1.y - v2.y)*(v1.y - v2.y);
    d += (v1.z - v2.z)*(v1.z - v2.z);

    return Math.sqrt(d);
};