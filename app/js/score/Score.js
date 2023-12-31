import {Section} from "./Section.js"

export class Score extends EventTarget {
  constructor(instrumentMgr) {
    super();
    this.DEFAULT_BPM = 90;
    this.instrumentMgr = instrumentMgr;
    this._rainbow = [
      "0000A0", "00A0A0", "A000A0", "00A000", "A0A000", "A00000", "A0A0A0",
      "000080", "008080", "800080", "008000", "808000", "800000", "808080",
      "C0C0C0",
      "FF00FF", "00FFFF", "FFFF00", "0000FF", "00FF00", "FF0000",
    ];
    this._reset();
  }

  _reset() {
    this.url = undefined;
    this._ymlRawScore = undefined;
    this._ymlScore = undefined;
    this.loaded = false;
    this.name = undefined;
    this.originalbpm = undefined;
    this.bpm = undefined;
    this.scoreStr = undefined;
    this.sections = undefined;
    this.scoreSections = undefined;
    this.num16ths = undefined;
    this.numBars = undefined;
    this.numBeats = undefined;
    this.loadedTracks = undefined;
    this._lut = undefined;
  }

  load(crewId, scoreId) {
    const url = this._getScoreURL(crewId, scoreId);
    this._reset();
    this.url = url;

    const self = this;
    $.get(url).done(function(data) {
      try {
        self._parseScore(data);
      } catch (error) {
        self._error(`[Score] ERROR processing ${scoreId}: ${error}`);
      }
    }).fail(function(e) {
      self._error(`[Score] ERROR loading ${url} (${e.statusText})`);
    });
  }

  parse(text) {
    this._reset();
    this.url = "Manual edit";

    try {
      this._parseScore(text);
    } catch (error) {
      this._error(`[Score] ERROR processing manual score text: ${error}`);
    }
  }

  getDurationMinutes() {
    return this.numBeats / this.bpm;
  }

  getDurationSeconds() {
    return this.getDurationMinutes() * 60;
  }

  getDurationStr() {
    var minutes = Math.floor(this.getDurationMinutes());
    var seconds = Math.floor(this.getDurationSeconds() % 60);

    if (seconds < 10)
      return `${minutes}:0${seconds}`;
    else
      return `${minutes}:${seconds}`;
  }


  getScoreSectionBy16thIndex(current16th) {
    return this._lut.by16th[current16th].section;
  }


  getScoreSectionIndexBy16thIndex(current16th) {
    return this._lut.by16th[current16th].sectionIndex;
  }


  get16thScoreSectionOffset(current16th) {
    return this._lut.by16th[current16th].sectionOffset;
  }


  getScoreSection16thOffset(sectionIndex) {
    return this._lut.bySectionIndex[sectionIndex].sectionOffset;
  }


  getYmlRawScore() {
    return this._ymlRawScore;
  }

  getYmlScoreObject() {
    return this._ymlScore;
  }


  _error(msg) {
    this.dispatchEvent(new CustomEvent('error',
      {detail: { error: msg }}));
  }

  _parseScore(ymlData) {
    this._ymlRawScore = ymlData;

    try {
      this._ymlScore = jsyaml.load(ymlData);
    } catch (error) {
      this._error(`[Score] ERROR: Invalid data in ${this.url} - ${error}`);
      return;
    }
    this.loaded = true;

    this.name = this._ymlScore.name;
    this.originalbpm = this._ymlScore.bpm;

    if ( this.originalbpm == undefined )
      this.originalbpm = this.DEFAULT_BPM;

    this.bpm = this.originalbpm;

    this.sections = {};
    const _tmpLoadedTracks = new Set();

    var index = 0;
    for (const sectionId in this._ymlScore.sections) {
      const _ymlSectionData = this._ymlScore.sections[sectionId];
      const newSection = new Section(sectionId, _ymlSectionData, this.instrumentMgr);

      if (newSection.color == "")
        newSection.color = this._getRainbowColor(index);

      this.sections[sectionId] = newSection;

      for (const _instrumentId of newSection.loadedTracks)
        _tmpLoadedTracks.add(_instrumentId);

      index++;
    }

    // Build loadedTracks list in the same order as instrumentMgr.all()
    this.loadedTracks = [];
    for (const instrumentId in this.instrumentMgr.all()) {
      if (_tmpLoadedTracks.has(instrumentId))
        this.loadedTracks.push(instrumentId);
    }

    this.scoreStr = this._ymlScore.score;
    if ( this.scoreStr == undefined ) {
      this.scoreStr = "";
      for (const sectionId in this._ymlScore.sections) {
        this.scoreStr += `${sectionId} `;
      }
    }

    this.num16ths = 0;
    this.numBars = 0;
    this.numBeats = 0;
    this.scoreSections = [];
    const sectionList = this.scoreStr.split(" ");
    for (const i in sectionList) {
      const sectionId = sectionList[i];
      const section = this.sections[sectionId];
      if (section) {
        this.scoreSections.push(section);
        this.num16ths += section.num16ths;
        this.numBars += section.numBars;
        this.numBeats += section.numBeats;
      }
    }

    if ( this.name == undefined
      || this.sections == undefined
      ){
        this._error(`[Score] ERROR: Invalid data in ${this.url}`);
        return;
      }

    this._buildLUT();

    this.dispatchEvent(new Event('ready'));
  }

  _buildLUT() {
    this._lut = {
      by16th: {},
      bySectionIndex: {},
    };

    var _last16th = 0;
    for (var index=0; index < this.scoreSections.length; index++) {
      const section = this.scoreSections[index];

      this._lut.bySectionIndex[index] = {
        sectionOffset: _last16th,
      };

      for (var _16thIndex=0; _16thIndex < section.num16ths; _16thIndex++) {
        this._lut.by16th[_last16th+_16thIndex] = {
          section: section,
          sectionIndex: index,
          sectionOffset: _16thIndex,
        };
      };
      _last16th += section.num16ths;
    };
  }

  _getScoreURL(crewId, scoreId) {
    return `./data/crews/${crewId}/scores/${scoreId}.yml?ts=${Date.now()}`;
  }

  _getRainbowColor(index) {
    return this._rainbow[index % this._rainbow.length];
  }
}
