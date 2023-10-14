import * as Tone from "https://cdn.skypack.dev/tone";

export class Sample extends EventTarget {
  constructor(instrument, id, fileName) {
    super();
    this.BASE_URL = "./data/instruments";
    this.instrument = instrument;
    this.id = id;
    this.fileName = fileName;
    this.url = `${this.BASE_URL}/samples/${fileName}`;
    this.player = undefined;
    this._volume = 0;
  }

  init() {
    this.player = new Tone.Player(this.url).toDestination();
  }

  getVolume() {
    return this._volume;
  }

  setVolume(db) {
    this._volume = db;
  }

  play(time=undefined, force=false) {
    if (!this.instrument.audible() && !force)
      return;

    Tone.loaded().then(() => {
      this.player.volume.value = this._volume;
      this.player.start(time);
    });
  }

}
