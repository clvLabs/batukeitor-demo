import * as Tone from "https://cdn.skypack.dev/tone";
import {Metronome} from "./Metronome.js"

export class AudioManager extends EventTarget {
  constructor() {
    super();
    this.audioContext = undefined;
    this.audioContextUnlocked = false;
    this.instrumentMgr = undefined;
    this.metronome = new Metronome(this._tick.bind(this));
    this.score = undefined;
    this.section = undefined;
    this.bpm = 1;
    this.sectionMode = false;
    this.current16th = 0;
    this.min16th = 0;
    this.max16th = 0;
    this.nextNoteTime = 0.0;
    this.scheduleAheadTime = 0.1;
    this.loop = false;
    this.scheduledBeatTimes = [];
  }

  init(instrumentMgr) {
    this.instrumentMgr = instrumentMgr;

    Object.values(instrumentMgr.all()).forEach(instrument => {
      instrument.init();
    });

    Tone.loaded().then(() => {
      this.dispatchEvent(new Event('ready'));
    });
  }

  setBPM(bpm) {
    this.bpm = bpm;
    this.metronome.setBPM(bpm);
  }

  playScore(score, scoreSectionIndex) {
    this.score = score;
    this.sectionMode = false;

    this.current16th = this.score.getScoreSection16thOffset(scoreSectionIndex);

    if (this.loop) {
      const section = this.score.scoreSections[scoreSectionIndex];
      this.min16th = this.current16th;
      this.max16th = this.current16th + section.num16ths;
    } else {
      this.min16th = 0;
      this.max16th = score.num16ths;
    }

    this._play();
  }

  playSection(score, section) {
    this.score = score;
    this.section = section;
    this.sectionMode = true;
    this.min16th = 0;
    this.max16th = section.num16ths;
    this.current16th = 0;
    this._play();
  }

  stop() {
    this.scheduledBeatTimes = [];
    this.metronome.stop();
    // Delay the stopped event
    setTimeout(() => {
      this.dispatchEvent(new Event('stopped'));
    }, this.scheduleAheadTime * 1000);
  }

  _play() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (!this.audioContextUnlocked) {
      // play silent buffer to unlock the audio
      var node = this.audioContext.createBufferSource();
      node.buffer = this.audioContext.createBuffer(1, 1, 22050);
      node.start(0);
      this.audioContextUnlocked = true;
    }

    this.scheduledBeatTimes = [];
    this.metronome.start();
    this.nextNoteTime = this.audioContext.currentTime + 0.1; // Add a little delay to avoid "glitches"
    this.dispatchEvent(new Event('started'));
  }

  _tick() {
    var _currentSection = undefined;
    var _currentScoreSectionIndex = undefined;
    var _currentSection16thIndex = undefined;

    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime ) {

      // Find section/16thIndex
      if (this.sectionMode) {
        _currentSection = this.section;
        _currentSection16thIndex = this.current16th;
        _currentScoreSectionIndex = undefined;
      } else {
        _currentSection = this.score.getScoreSectionBy16thIndex(this.current16th);
        _currentSection16thIndex = this.score.get16thScoreSectionOffset(this.current16th);
        _currentScoreSectionIndex = this.score.getScoreSectionIndexBy16thIndex(this.current16th);
      }

      // Schedule notes
      this.scheduledBeatTimes.push({
        time: this.nextNoteTime,
        global16thIndex: this.current16th,
        section: _currentSection,
        section16thIndex: _currentSection16thIndex,
        scoreSectionIndex: _currentScoreSectionIndex,
      });

      Object.values(_currentSection.tracks).forEach(track => {
        const sample = track.samples[_currentSection16thIndex];
        if (sample) {
          sample.play(this.nextNoteTime);
        }
      });

      setTimeout(() => {
        this.dispatchEvent(new Event('tick'));
      });

      // Advance current note and time by a 16th note...
      var secondsPerBeat = 60.0 / this.bpm;

      // Add beat length to last beat time
      if (_currentSection.timeSignature.isCompound())
        this.nextNoteTime += secondsPerBeat/6;
      else
        this.nextNoteTime += secondsPerBeat/4;

      this.current16th++;
      if (this.current16th == this.max16th) {
        if (this.loop)
          this.current16th = this.min16th;
        else
          this.stop();
      }

    }
  }
}
