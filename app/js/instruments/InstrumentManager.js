import {Instrument} from "./Instrument.js"

export class InstrumentManager extends EventTarget {
  constructor() {
    super();
    this.BASE_URL = "./data/instruments";
    this._list = {}
    this._soloInstruments = [];
  }

  init() {
    const self = this;
    $.get(this._getInstrumentListURL()).done(function(data) {
      try {
        self._parseInstrumentList(data);
      } catch (error) {
        self._error(`[Instrument] ERROR processing instrument list: ${error}`);
      }
    }).fail(function() {
      self._error(`[Instrument] ERROR loading instrument list: ${url}`);
    });
  }

  all() {
    return this._list;
  }

  get(instrumentId) {
    return this._list[instrumentId];
  }

  muteInstrument(instrument, mute) {
    instrument._muted = mute;
  }

  soloInstrument(instrument, solo) {
    if (solo == true) {
      if (!this._soloInstruments.includes(instrument)){
        instrument._solo = true;
        this._soloInstruments.push(instrument);
      }

      Object.values(this._list).forEach(_instrument => {
        if (_instrument !== instrument){
          if (_instrument._solo == undefined) {
            _instrument._solo = false;
          }
        }
      });
    } else {
      if (this._soloInstruments.includes(instrument)){
        instrument._solo = false;

        const index = this._soloInstruments.indexOf(instrument);
        this._soloInstruments.splice(index, 1);

        if (!this._soloInstruments.length) {
          Object.values(this._list).forEach(_instrument => {
            _instrument._solo = undefined;
          });
        }
      }
    }
  }

  _error(msg) {
    this.dispatchEvent(new CustomEvent('error',
      {detail: { error: msg }}));
  }

  _parseInstrumentList(ymlData) {
    var _ymlInstrumentList;
    try {
      _ymlInstrumentList = jsyaml.load(ymlData);
    } catch (error) {
      this._error(`[Instrument] ERROR: Invalid data in instruments file - ${error}`);
      return;
    }
    this.loaded = true;

    for (const instrumentId in _ymlInstrumentList.instruments)
    {
      const instrumentData = _ymlInstrumentList.instruments[instrumentId];
      this._list[instrumentId] = new Instrument(instrumentId, instrumentData);
    }

    this.dispatchEvent(new Event('ready'));
  }

  _getInstrumentListURL() {
    return `${this.BASE_URL}/instruments.yml?ts=${Date.now()}`;
  }

}
