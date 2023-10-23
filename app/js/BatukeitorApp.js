import {AudioManager} from "./audio/AudioManager.js"
import {CrewManager} from "./crew/CrewManager.js"
import {InstrumentManager} from "./instruments/InstrumentManager.js"
import {UIManager} from "./ui/UIManager.js"
import {Score} from "./score/Score.js"

export class BatukeitorApp {
  constructor() {
    this.audioMgr = new AudioManager();
    this.audioMgr.addEventListener("ready", this.onAudioManagerReady.bind(this));
    this.audioMgr.addEventListener("error", this.onAudioManagerError.bind(this));
    this.audioMgr.addEventListener("started", this.onAudioManagerStarted.bind(this));
    this.audioMgr.addEventListener("stopped", this.onAudioManagerStopped.bind(this));
    this.audioMgr.addEventListener("tick", this.onAudioManagerTick.bind(this));

    this.crewMgr = new CrewManager();
    this.crewMgr.addEventListener("ready", this.onCrewManagerReady.bind(this));
    this.crewMgr.addEventListener("error", this.onCrewManagerError.bind(this));
    this.crew = undefined;

    this.instrumentMgr = new InstrumentManager();
    this.instrumentMgr.addEventListener("ready", this.onInstrumentManagerReady.bind(this));
    this.instrumentMgr.addEventListener("error", this.onInstrumentManagerError.bind(this));

    this.uiMgr = new UIManager(this.crewMgr);
    this.uiMgr.addEventListener("load", this.onUIManagerLoad.bind(this));
    this.uiMgr.addEventListener("parse", this.onUIManagerParse.bind(this));
    this.uiMgr.addEventListener("play", this.onUIManagerPlay.bind(this));
    this.uiMgr.addEventListener("stop", this.onUIManagerStop.bind(this));
    this.uiMgr.addEventListener("jumpTo", this.onUIManagerJumpTo.bind(this));
    this.uiMgr.addEventListener("setBPM", this.onUIManagerSetBPM.bind(this));
    this.uiMgr.addEventListener("playSample", this.onUIManagerPlaySample.bind(this));
    this.uiMgr.addEventListener("changeInstrumentVolume", this.onUIManagerChangeInstrumentVolume.bind(this));

    this.score = new Score(this.instrumentMgr);
    this.score.addEventListener("ready", this.onScoreReady.bind(this));
    this.score.addEventListener("error", this.onScoreError.bind(this));
  }

  run() {
    this.crewMgr.init();
    this.instrumentMgr.init();
  }

  onAudioManagerReady() {
  }

  onAudioManagerError(e) {
    alert(`[Audio] ERROR: ${e.detail.error}`);
  }

  onAudioManagerStarted() {
    this.uiMgr.setAudioManagerPlaying(true);
  }

  onAudioManagerStopped() {
    this.uiMgr.setAudioManagerCurrentBeat(undefined);
    this.uiMgr.setAudioManagerPlaying(false);
  }

  onAudioManagerTick(e) {
    var nextBeatToPlay = undefined;

    for (var i=0; i < this.audioMgr.scheduledBeatTimes.length; i++) {
      const currentBeat = this.audioMgr.scheduledBeatTimes[i];

      nextBeatToPlay = i;
      if (currentBeat.time > this.audioMgr.audioContext.currentTime) {
        break;
      }
    }

    if (nextBeatToPlay == undefined)
      return;

    const lastPlayedBeat = this.audioMgr.scheduledBeatTimes[nextBeatToPlay];
    this.uiMgr.setAudioManagerCurrentBeat(lastPlayedBeat);

    this.audioMgr.scheduledBeatTimes = this.audioMgr.scheduledBeatTimes.slice(nextBeatToPlay+1);
  }

  onCrewManagerReady() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var crewId = urlParams.get('crew');
    if (crewId == null)
      crewId = this.crewMgr.getDefaultCrewId();

    this.crew = this.crewMgr.get(crewId);
    if (this.crew == null) {
      alert(`[Crews] Crew not found: ${crewId}`);
    } else {
      this.uiMgr.init(crewId);
    }
  }

  onCrewManagerError(e) {
    alert(`[Crews] ERROR: ${e.detail.error}`);
  }

  onInstrumentManagerReady() {
    this.uiMgr.setInstrumentManager(this.instrumentMgr);
    this.audioMgr.init(this.instrumentMgr);
  }

  onInstrumentManagerError(e) {
    this.uiMgr.setInstrumentManager(undefined, e.detail.error);
  }

  onUIManagerLoad(e) {
    this.score.load(this.crew.id, e.detail.scoreId);
  }

  onUIManagerParse(e) {
    this.score.parse(e.detail.text);
  }

  onUIManagerPlay(e) {
    this.audioMgr.setBPM(this.score.bpm);
    this.audioMgr.loop = e.detail.loop;
    if (e.detail.mode == "score") {
      this.audioMgr.playScore(e.detail.score, e.detail.scoreSectionIndex);
    } else if (e.detail.mode == "section") {
      this.audioMgr.playSection(e.detail.score, e.detail.section);
    }
  }

  onUIManagerStop() {
    this.audioMgr.stop();
  }

  onUIManagerJumpTo(e) {
    this.audioMgr.jumpTo(e.detail.index);
  }

  onUIManagerSetBPM(e) {
    this.audioMgr.setBPM(e.detail.bpm);
  }

  onUIManagerPlaySample(e) {
    const instrument = this.instrumentMgr.get(e.detail.instrumentId);
    instrument.play(e.detail.sampleId, true);
  }

  onUIManagerChangeInstrumentVolume(e) {
    const instrument = this.instrumentMgr.get(e.detail.instrumentId);
    instrument.setVolume(e.detail.volume);
  }

  onScoreReady(e) {
    this.uiMgr.setScore(this.score);
  }

  onScoreError(e) {
    this.uiMgr.setScoreError(e.detail.error);
  }
}
