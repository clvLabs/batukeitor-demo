import {TimeSignature} from "./TimeSignature.js"
import {Track} from "./Track.js"

export class Section {
  constructor(id, ymlData, instrumentMgr) {
    this.DEFAULT_TIME_SIGNATURE = "4/4";
    this.METRONOME_INSTRUMENT_ID = "MT";

    this.id = id;
    this.name = ymlData.name;
    this.color = ymlData.color;

    if (ymlData.timeSignature)
      this.timeSignature = new TimeSignature(ymlData.timeSignature);
    else
      this.timeSignature = new TimeSignature(this.DEFAULT_TIME_SIGNATURE);

    this.instrumentMgr = instrumentMgr;
    this.tracks = {};
    var _tmpTracks = {};

    if (this.color[0] == "#")
    this.color = this.color.substring(1);

    // Get max section length looking at all tracks
    var maxSectionLen = 0;
    for (const trackId in ymlData.tracks) {
      const ymlTrackNotes = ymlData.tracks[trackId];
      if (ymlTrackNotes.length > maxSectionLen)
        maxSectionLen = ymlTrackNotes.length;
    }

    // Add score tracks to temporary list
    for (const trackId in ymlData.tracks) {
      const ymlTrackNotes = ymlData.tracks[trackId].padEnd(maxSectionLen, " ");
      const instrument = this.instrumentMgr.get(trackId);
      _tmpTracks[trackId] = new Track(
        trackId,
        ymlTrackNotes,
        this.timeSignature,
        instrument);
    }

    // Calculate number of 16ths/Bars/Beats
    this.num16ths = 0;
    this.numBars = 0;
    this.numBeats = 0;

    Object.values(_tmpTracks).forEach(track => {
      if (track.num16ths > this.num16ths) {
        this.num16ths = track.num16ths;
        this.numBars = track.numBars;
        this.numBeats = track.numBeats;
      }
    });

    // Add metronome track to "definitive" list
    this.tracks[this.METRONOME_INSTRUMENT_ID] = new Track(
      this.METRONOME_INSTRUMENT_ID,
      this.timeSignature.getMetronomeBarDisplayStr().repeat(this.numBars),
      this.timeSignature,
      this.instrumentMgr.get(this.METRONOME_INSTRUMENT_ID));

    // Add rest of tracks to "definitive" list
    Object.values(_tmpTracks).forEach(track => {
      this.tracks[track.id] = track;
    });

  }

  getMetronomeDisplayStr() {
    return this.timeSignature.getMetronomeBarDisplayStr().repeat(this.numBars);
  }

}
