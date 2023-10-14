
class MetronomeWorker {
  constructor() {
    this.timerId = null;
    this.interval = 100;
    postMessage("ready");
  }

  onmessage(e) {
    if (e.data.cmd == "start") {
      this._start();
    } else if (e.data.cmd == "stop") {
      this._stop();
    } else if (e.data.cmd == "setInterval") {
      this._setInterval(e.data.interval);
    }
  }

  _start() {
    this.timerId = setInterval(this._tick.bind(this),this.interval)
    postMessage("started");
  }

  _stop() {
    clearInterval(this.timerId);
    this.timerId = null;
    postMessage("stopped");
  }

  _setInterval(interval) {
    this.interval = interval;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = setInterval(this._tick.bind(this),this.interval)
    }
  }

  _tick() {
    postMessage("tick");
  }

}

_worker = new MetronomeWorker();
self.onmessage = (e) => { _worker.onmessage(e) };
