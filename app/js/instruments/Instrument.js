import * as Tone from "https://cdn.skypack.dev/tone";
import {Sample} from "./Sample.js"

export class Instrument extends EventTarget {
  constructor(instrumentId, ymlInstrumentData) {
    super();
    this.BASE_URL = "./data/instruments";
    this.id = instrumentId;
    this.name = ymlInstrumentData.name;
    this.iconURL = `${this.BASE_URL}/img/${this.id}.png`;
    this.samples = {};
    this._muted = false;
    this._solo = undefined;
    this._volume = 0;

    for (const sampleId in ymlInstrumentData.samples) {
      const fileName = ymlInstrumentData.samples[sampleId];

      this.samples[sampleId] = new Sample(this, sampleId, fileName);
    }
  }

  init() {
    for (const sampleId in this.samples) {
      const sample = this.samples[sampleId];
      sample.init();
    }
  }

  getVolume() {
    return this._volume;
  }

  setVolume(db) {
    this._volume = db;
    Object.values(this.samples).forEach(sample => {
      sample.setVolume(db);
    });
  }

  muted() {
      return this._muted;
  }

  solo() {
    return this._solo;
  }

  audible() {
    if (this._solo !== undefined)
      return this._solo;

    return !this._muted;
  }

  play(sampleId, force=false) {
    if (!this.audible() && !force)
      return;

    Tone.loaded().then(() => {
      this.samples[sampleId].play(undefined, force);
    });
  }

}
