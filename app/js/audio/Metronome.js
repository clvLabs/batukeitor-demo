
export class Metronome extends EventTarget {
  constructor(tickCallback) {
    super();
    this.DEFAULT_WORKER_INTERVAL = 25.0;
    this.tickCallback = tickCallback;
    this.timerId = null;
    this.bpm = 0;
    this.interval = 1000;
    this.worker = new Worker("./app/js/audio/MetronomeWorker.js");
    this.worker.onmessage = this._onWorkerMessage.bind(this);
    this.workerReady = false;
    this.workerStarted = false;
  }

  setBPM(bpm) {
    this.bpm = bpm;
  }

  start() {
    if (!this.workerReady) {
      console.log("[Metronome] start() - [ERROR] Worker not ready yet");
      return;
    }

    if (this.workerStarted) {
      console.log("[Metronome] start() - [WARNING] Worker already started");
      return;
    }

    this.worker.postMessage({cmd: "start"});
  }

  stop() {
    if (!this.workerReady) {
      console.log("[Metronome] stop() - [ERROR] Worker not ready yet");
      return;
    }

    if (!this.workerStarted) {
      console.log("[Metronome] stop() - [WARNING] Worker already stopped");
      return;
    }

    this.worker.postMessage({cmd: "stop"});
  }

  _onWorkerMessage(e) {
    if (e.data == "ready") {
      this._onWorkerReady();
    } else if (e.data == "started") {
      this._onWorkerStarted();
    } else if (e.data == "stopped") {
      this._onWorkerStopped();
    } else if (e.data == "tick") {
      this._onWorkerTick();
    } else {
      this._onWorkerUnknownMessage(e);
    }
  }

  _onWorkerReady() {
    this.workerReady = true;
    this.worker.postMessage({cmd: "setInterval", interval: this.DEFAULT_WORKER_INTERVAL});
  }

  _onWorkerStarted() {
    this.workerStarted = true;
  }

  _onWorkerStopped() {
    this.workerStarted = false;
  }

  _onWorkerTick() {
    this._runScheduler();
  }

  _onWorkerUnknownMessage(e) {
    console.log("[Metronome] UNKNOWN message from MetronomeWorker: ", e);
  }

  _runScheduler() {
    // Use a callback instead of an event (no delays, please)
    this.tickCallback();
  }
}
