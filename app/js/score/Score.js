import {Section} from "./Section.js"

export class Score extends EventTarget {
  constructor(instrumentMgr) {
    super();
    this.DEFAULT_BPM = 90;
    this.instrumentMgr = instrumentMgr;
    this._reset();
  }

  _reset() {
    this.url = undefined;
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
    for (const section of this.scoreSections) {
      if (current16th < section.num16ths)
        return section;
      else
        current16th -= section.num16ths;
    }
    return undefined;
  }


  getScoreSectionIndexBy16thIndex(current16th) {
    for (var index=0; index < this.scoreSections.length; index++) {
      const section = this.scoreSections[index];

      if (current16th < section.num16ths) {
        return index;
      } else {
        current16th -= section.num16ths;
      }
    };

    return undefined;
  }


  get16thScoreSectionOffset(current16th) {
    for (const section of this.scoreSections) {
      if (current16th < section.num16ths)
        return current16th;
      else
        current16th -= section.num16ths;
    }
    return undefined;
  }


  getScoreSection16thOffset(sectionIndex) {
    var offset = 0;

    for (var index=0; index < sectionIndex; index++) {
      offset += this.scoreSections[index].num16ths;
    };

    return offset;
  }


  _error(msg) {
    this.dispatchEvent(new CustomEvent('error',
      {detail: { error: msg }}));
  }

  _parseScore(ymlData) {
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
    for (const sectionId in this._ymlScore.sections) {
      const _ymlSectionData = this._ymlScore.sections[sectionId];
      this.sections[sectionId] = new Section(sectionId, _ymlSectionData, this.instrumentMgr);
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

    this.dispatchEvent(new Event('ready'));
  }

  _getScoreURL(crewId, scoreId) {
    return `./data/crews/${crewId}/scores/${scoreId}.yml?ts=${Date.now()}`;
  }
}
