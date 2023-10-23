
export class UIManager extends EventTarget {
  constructor(crews) {
    super();
    this.PLAYER_BEAT_WIDTH_PIXELS = 100;
    this.FULL_MODULE_16THS = (4*4*2);    // 2 full 4/4 bars
    this.crews = crews;
    this.score = undefined;
    this.instrumentMgr = undefined;
    this.playMode = "";
    this.playLoop = false;
    this.lastPlayedBeat = undefined;
  }

  init(crewId) {

    window.onscroll = () => {
      const header = $("#app-sticky-header");
      var winOfs = window.scrollY;
      var hdrOfs = header.offset().top;

      if (winOfs == hdrOfs) {
        if (winOfs <= 80) {
          if (header.hasClass("sticky"))
            header.removeClass("sticky");
        }
      } else if (winOfs > hdrOfs) {
        if (!header.hasClass("sticky"))
          header.addClass("sticky");
      } else {
        if (header.hasClass("sticky"))
          header.removeClass("sticky");
      }
    };


    $("#app").show();

    $("#crew-selector").on("input", this._onCrewSelectorInput.bind(this));
    $("#score-selector").on("input", this._onScoreSelectorInput.bind(this));

    $("#tab-button-score").on("click", { tab: "score-tab"}, this._onTabSelected.bind(this));
    $("#tab-button-sections").on("click", { tab: "sections-tab"}, this._onTabSelected.bind(this));
    $("#tab-button-instruments").on("click", { tab: "instruments-tab"}, this._onTabSelected.bind(this));
    $("#tab-button-editor").on("click", { tab: "editor-tab"}, this._onTabSelected.bind(this));

    $("#extra-control-bpm-slider").on("input", this._onBPMSliderInput.bind(this));
    $("#extra-control-bpm-reset").on("click", this._onBPMResetClicked.bind(this));
    $("#extra-control-stop-button").on("click", this._onExtraStopButton.bind(this));
    $("#extra-control-play-button").on("click", this._onExtraPlayButton.bind(this));

    $("#editor-tab-apply-button").on("click", this._onEditorApplyButton.bind(this));
    $("#editor-tab-clipboard-button").on("click", this._onEditorClipboardButton.bind(this));
    $("#editor-tab-reload-button").on("click", this._onEditorReloadButton.bind(this));

    $("#tab-button-score").addClass("active");
    $(`#score-tab`).show();

    var crew;

    for (const _crewId in this.crews.all()) {
      crew = this.crews.get(_crewId);

      $("#crew-selector").append(
        $("<option>",{
          value: _crewId,
          text: crew.name,
          selected: (_crewId == crewId),
        })
      );
    }

    crew = this.crews.get(crewId);
    for (const _scoreId in crew.scores) {
      const _scoreName = crew.scores[_scoreId]

      $("#score-selector").append(
        $("<option>",{
          value: _scoreId,
          text: _scoreName,
        })
      );

    }

    this._onScoreSelectorInput();
  }

  setInstrumentManager(instrumentMgr, errorMsg) {
    this.instrumentMgr = instrumentMgr;
    var errorsFound = false;

    if (instrumentMgr == undefined) {
      errorsFound = true;
      $("#instruments-tab-content").html(`Cannot load instruments<br/>${errorMsg}`);
      return;
    }

    $("#instruments-tab-content").html("");
    for (const instrumentId in instrumentMgr.all()) {
      this._buildInstrumentUI(instrumentId).appendTo("#instruments-tab-content");
    }

    // Mute metronome at startup
    this._muteInstrument(this.instrumentMgr.get("MT"), true);
  }

  setAudioManagerPlaying(playing) {
    if (playing) {
      $(`.score-minimap-section`).addClass("playing");
      $(`#extra-control-play-button`).addClass("disabled");
      $(`#extra-control-stop-button`).removeClass("disabled");
    } else {
      $(`.score-minimap-section`).removeClass("playing");
      $(`#extra-control-play-button`).removeClass("disabled");
      $(`#extra-control-stop-button`).addClass("disabled");

      // Play
      $(`.play-button`).each((index, item) => {
        $(item).removeClass("disabled");
        $(item).removeClass("active");
      });

      $(`.play-button-icon`).each((index, item) => {
        $(item).removeClass("disabled");
        $(item).removeClass("active");
      });

      // Loop
      $(`.loop-button`).each((index, item) => {
        $(item).removeClass("disabled");
        $(item).removeClass("active");
      });

      $(`.loop-button-icon`).each((index, item) => {
        $(item).removeClass("disabled");
        $(item).removeClass("active");
      });
    }
  }

  setAudioManagerCurrentBeat(currentBeat) {

    var noteElmId;

    if (this.lastPlayedBeat) {
      const lb = this.lastPlayedBeat;
      Object.values(lb.section.tracks).forEach(track => {
        if (this.playMode == "score")
          noteElmId = `score-section-${lb.scoreSectionIndex}-${lb.section.id}-track-${track.id}-16th-${lb.section16thIndex}`;
        else
          noteElmId = `section-${lb.section.id}-track-${track.id}-16th-${lb.section16thIndex}`;

        $(`#${noteElmId}`).removeClass("note-active");
      });

      if (this.playMode == "score")
        $(`#score-minimap-section-${lb.scoreSectionIndex}`).removeClass("score-minimap-active-section");
    }

    var sampleNoteElm = undefined;
    if (currentBeat) {
      const cb = currentBeat;
      Object.values(cb.section.tracks).forEach(track => {
        if (this.playMode == "score")
          noteElmId = `score-section-${cb.scoreSectionIndex}-${cb.section.id}-track-${track.id}-16th-${cb.section16thIndex}`;
        else
          noteElmId = `section-${cb.section.id}-track-${track.id}-16th-${cb.section16thIndex}`;

        $(`#${noteElmId}`).addClass("note-active");

        if (sampleNoteElm == undefined) {
          sampleNoteElm = $(`#${noteElmId}`);
        }
      });

      if (this.playMode == "score") {
        if (!this.playLoop) {
          var currentXPos = sampleNoteElm.offset().left
                          - $("#score-scrolling-content").offset().left
                          - this.PLAYER_BEAT_WIDTH_PIXELS;  // Leave a beat past current played note

          $("#score-scrolling-container").scrollLeft(currentXPos);
        }

        $(`#score-minimap-section-${cb.scoreSectionIndex}`).addClass("score-minimap-active-section");
      }
    }

    this.lastPlayedBeat = currentBeat;
  }

  setScoreError(errorMsg) {
    this.score = undefined;
    $("#score-info").text("");
    $("#score-minimap").html("");
    $("#score-tab-content").html(`Cannot load score<br/>${errorMsg}`);
    $("#sections-tab-content").html(`Cannot load score<br/>${errorMsg}`);
    $("#editor-error-message").html(`Cannot load score<br/>${errorMsg}`);
  }

  setScore(score) {
    this.score = score;

    this._updateScoreInfo();

    // Score -------------------------------------------------------
    $("#score-minimap").html("");
    this._buildScoreMiniMap().appendTo("#score-minimap");

    // Sections -------------------------------------------------------
    $("#sections-tab-content").html("");

    if (this.score.sections == null) {
      $("#sections-tab-content").text(`[ERROR] Score has no sections`);
      return;
    }

    for (const sectionId in this.score.sections) {
      this._buildSectionUI("section-", sectionId).appendTo("#sections-tab-content");
    }

    const scoreTabContentElm = $("#score-tab-content");
    scoreTabContentElm.html("");

    const instrumentsContainerElm = $("<div>", {
      id: "score-instruments-container",
    });
    instrumentsContainerElm.appendTo(scoreTabContentElm);

    const sectionHeaderElm = $("<div>", {
      id: `score-instruments-container-header`,
    });
    sectionHeaderElm.appendTo(instrumentsContainerElm);

    this._buildTrackInstrumentsUI("score", this.instrumentMgr.all(), true).appendTo(instrumentsContainerElm);

    const scrollingContainerElm = $("<div>", {
      id: "score-scrolling-container",
    });
    scrollingContainerElm.appendTo(scoreTabContentElm);

    const scrollingContentElm = $("<div>", {
      id: "score-scrolling-content",
    });
    scrollingContentElm.appendTo(scrollingContainerElm);

    var scoreWidth = this.score.numBeats * this.PLAYER_BEAT_WIDTH_PIXELS;
    scrollingContentElm.css("width", `${scoreWidth}px`);

    this.score.scoreSections.forEach((section, index) => {
      this._buildSectionUI(`score-section-${index}-`, section.id, index).appendTo(scrollingContentElm);
    });

    // Update instrument states
    this._updateInstrumentStates();

    // Editor -------------------------------------------------------
    $("#editor-error-message").text("");
    $("#score-editor-textbox").val(score.getYmlRawScore());
  }

  _updateScoreInfo() {
    var scoreInfo = "";
    scoreInfo += `${this.score.name}:`;
    scoreInfo += ` ${this.score.numBeats} beats`;
    scoreInfo += ` @${this.score.bpm}BPM`;
    scoreInfo += ` = ${this.score.getDurationStr()}`;
    $("#score-info").text(scoreInfo);

    $("#current-bpm").text(this.score.bpm);
    $("#extra-control-bpm-slider").val(this.score.bpm);
  }

  _buildInstrumentUI(instrumentId) {
    const instrument = this.instrumentMgr.get(instrumentId);

    const instrumentElm = $("<div>", {
      id: `instrument-${instrument.id}-info`,
      class: "instrument-info",
    });

    // Id
    const instrumentIdElm = $("<span>", {
      id: `instrument-${instrument.id}-id`,
      class: "instrument-id",
    });
    instrumentIdElm.text(instrument.id);
    instrumentIdElm.appendTo(instrumentElm);

    // Icon
    const instrumentIconElm = $("<img>", {
      id: `instrument-${instrument.id}-icon`,
      class: "instrument-icon",
      src: instrument.iconURL,
    });
    instrumentIconElm.appendTo(instrumentElm);

    // Name
    const instrumentNameElm = $("<span>", {
      id: `instrument-${instrument.id}-name`,
      class: "instrument-name",
    });
    instrumentNameElm.text(instrument.name);
    instrumentNameElm.appendTo(instrumentElm);

    // Volume Icon
    const volumeIconElm = $("<img>", {
      id: `instrument-${instrument.id}-volume-icon`,
      class: "instrument-volume-icon",
      src: "./app/img/volume-icon.svg",
    });
    volumeIconElm.on("click", { instrument: instrument }, this._onInstrumentVolumeIconClick.bind(this));
    volumeIconElm.appendTo(instrumentElm);

    // Volume slider
    const volumeElm = $("<input>", {
      id: `instrument-${instrument.id}-volume`,
      class: "instrument-volume slider",
      type: "range",
      min: -30,
      max: 15,
      value: 0,
    });
    instrumentElm.on("input", { instrumentId: instrumentId }, this._onInstrumentVolumeSliderInput.bind(this));
    volumeElm.appendTo(instrumentElm);

    // Samples
    const instrumentSamplesElm = $("<div>", {
      id: `instrument-${instrument.id}-samples-container`,
      class: "instrument-samples-container",
    });
    instrumentSamplesElm.appendTo(instrumentElm);

    for (const sampleId in instrument.samples) {
      const sampleFileName = instrument.samples[sampleId].fileName;

      const sampleElm = $("<button>", {
        id: `instrument-${instrument.id}-sample-${sampleId}`,
        class: "instrument-sample",
        title: sampleFileName,
      });
      sampleElm.text(sampleId);
      sampleElm.on("click", { instrumentId: instrumentId, sampleId: sampleId}, this._onInstrumentSamplePlay.bind(this));
      sampleElm.appendTo(instrumentSamplesElm);
    }

    return instrumentElm;
  }

  _buildScoreMiniMap() {
    const containerElm = $("<div>");

    this.score.scoreSections.forEach((section, index) => {
      const sectionWidth = (section.numBeats / this.score.numBeats) * 100;

      const sectionElm = $("<div>", {
        id: `score-minimap-section-${index}`,
        class: "score-minimap-section",
        title: section.name,
      });
      sectionElm.css("background-color", `#${section.color}`);
      sectionElm.css("width", `${sectionWidth}%`);
      sectionElm.on("click", {scoreSectionIndex: index}, this._onMinimapSectionClick.bind(this));

      sectionElm.appendTo(containerElm);
    });

    return containerElm;
  }

  _buildSectionUI(idPrefix, sectionId, scoreSectionIndex=undefined) {
    var fullModule = true;
    if (scoreSectionIndex != undefined)
      fullModule = false;

    const section = this.score.sections[sectionId];
    const sectionElmId = `${idPrefix}${sectionId}`;

    const sectionElm = $("<div>", {
      id: sectionElmId,
      class: fullModule ? "section-block-full" : "section-block-simple",
    });

    // Header container
    const sectionHeaderContainerElm = $("<div>", {
      id: `${sectionElmId}-header-container`,
      class: "section-header-container",
    });
    sectionHeaderContainerElm.appendTo(sectionElm);

    // Play
    const playHeaderElm = $("<div>", {
      class: "section-header-item",
    });
    playHeaderElm.appendTo(sectionHeaderContainerElm);

    const playButtonElm = $("<button>", {
      id: `${sectionElmId}-play-button`,
      class: "play-button",
    });

    if (fullModule)
      playButtonElm.on("click", {section: section}, this._onSectionPlayButton.bind(this));
    else
      playButtonElm.on("click", {scoreSectionIndex: scoreSectionIndex}, this._onScoreSectionPlayButton.bind(this));

    playButtonElm.appendTo(playHeaderElm);

    const playIconElm = $("<img>", {
      id: `${sectionElmId}-play-button-icon`,
      class: "play-button-icon",
    });
    playIconElm.appendTo(playButtonElm);

    // Loop
    const loopHeaderElm = $("<div>", {
      class: "section-header-item",
    });
    loopHeaderElm.appendTo(sectionHeaderContainerElm);

    const loopButtonElm = $("<button>", {
      id: `${sectionElmId}-loop-button`,
      class: "loop-button",
    });

    if (fullModule)
      loopButtonElm.on("click", {section: section}, this._onSectionLoopButton.bind(this));
    else
      loopButtonElm.on("click", {scoreSectionIndex: scoreSectionIndex}, this._onScoreSectionLoopButton.bind(this));

    loopButtonElm.appendTo(loopHeaderElm);

    const loopIconElm = $("<img>", {
      id: `${sectionElmId}-loop-button-icon`,
      class: "loop-button-icon",
    });
    loopIconElm.appendTo(loopButtonElm);

    // Header
    const sectionHeaderElm = $("<div>", {
      id: `${sectionElmId}-header`,
      class: "section-header",
    });

    if (!fullModule) {
      const sectionWidth = this.PLAYER_BEAT_WIDTH_PIXELS * (section.numBeats);
      sectionHeaderElm.css("width", `${sectionWidth}px`);
    }

    var headerTxt = "";
    if (fullModule) {
      headerTxt += `${section.name}`;
      headerTxt += ` (${section.timeSignature.name}`;
      if (section.numBars > 1) {
        headerTxt += ` ${section.numBars}B`;
      }
      headerTxt += `)`;
    } else {
      headerTxt = section.name;
    }
    sectionHeaderElm.text(`${headerTxt}`);
    sectionHeaderElm.css("background-color", `#${section.color}`);
    this._adjustTextColor(sectionHeaderElm);
    sectionHeaderElm.appendTo(sectionHeaderContainerElm);

    // Contents
    const sectionContentElm = $("<div>", {
      id: `${sectionElmId}-content`,
      class: "section-content",
    });
    sectionContentElm.appendTo(sectionElm);

    // Instrument list
    if (fullModule) {
      this._buildTrackInstrumentsUI(`section-${section.id}`, section.tracks).appendTo(sectionContentElm);
    }

    // Track list
    const sectionTracksElm = $("<div>", {
      id: `${sectionElmId}-track-list`,
      class: "section-track-list",
    });
    sectionTracksElm.appendTo(sectionContentElm);

    Object.values(section.tracks).forEach(track => {
      this._buildTrackUI(sectionElmId, section, track, fullModule).appendTo(sectionTracksElm);
    });

    return sectionElm;
  }

  _buildTrackInstrumentsUI(idPrefix, tracks, addHeaderSpacer=false) {
    const sectionInstrumentsElm = $("<div>", {
      id: `${idPrefix}-instrument-list`,
      class: "section-instrument-list",
    });

    if (addHeaderSpacer) {
      const playHeaderElm = $("<div>", {
        class: "section-header-item",
      });
      playHeaderElm.appendTo(sectionInstrumentsElm);
    }

    for (const trackId in tracks) {
      const instrument = this.instrumentMgr.get(trackId);

      const instrumentRowElm = $("<div>", {
        class: "section-instrument-row",
      });

      instrumentRowElm.appendTo(sectionInstrumentsElm);

      const instrumentIconElm = $("<img>",{
        id: `${idPrefix}-instrument-${instrument.id}-icon`,
        class: `section-instrument-icon track-${instrument.id}-mute track-${instrument.id}-solo`,
        src: instrument.iconURL,
        title: `[${instrument.id}] ${instrument.name}`,
      });
      instrumentIconElm.on("click", {instrument: instrument}, this._onTrackInstrumentClick.bind(this));
      instrumentIconElm.appendTo(instrumentRowElm);

    }
    return sectionInstrumentsElm;
  }

  _buildTrackUI(sectionElmId, section, track, fullModule=true) {
    const trackElm = $("<div>", {
      id: `${sectionElmId}-track-${track.id}`,
      class: `section-track-row  track-${track.id}-mute`,
    });

    for (var index=0; index < track.length; index++) {
      const sample = track.samples[index];
      var className = "section-track-16th";

      if (section.timeSignature.isBarStart(index)) {
        className += " bar-start";
      } else if (section.timeSignature.isBeatStart(index)) {
        className += " beat-start";
      } else if (section.timeSignature.isEighthNoteStart(index)) {
        className += " eighth-note-start";
      }

      if (fullModule) {
        var note16thWidth;
        if (section.num16ths <= this.FULL_MODULE_16THS)
          note16thWidth = 100 / this.FULL_MODULE_16THS;
        else
          note16thWidth = 100 / section.num16ths;

        if (section.timeSignature.isCompound())
          note16thWidth *= (1/1.5);
      } else {
        var note16thWidth = 100 / track.length;
      }

      const note16thElm = $("<div>", {
        id: `${sectionElmId}-track-${track.id}-16th-${index}`,
        class: className,
        style: `width: ${note16thWidth}%`,
      });

      if (sample)
        note16thElm.text(sample.id);

      note16thElm.appendTo(trackElm);
    }

    return trackElm;
  }

  _onCrewSelectorInput(e) {
    const newLocation = "./"
        + "?crew="
        + $("#crew-selector option:selected").val();

    window.location = newLocation;
  }

  _onScoreSelectorInput(e) {
    this.dispatchEvent(new CustomEvent("load",
      {detail: {
        scoreId: $("#score-selector option:selected").val()
      }}
    ));
  }

  _onTabSelected(e) {
    $("#main-tab-buttons")
    .children()
    .filter(".tab-button")
    .each( (i,obj) => {
      if (obj == e.target) {
        $(obj).addClass("active");
      } else {
        $(obj).removeClass("active");
      }
    });

    $("#app-content").children().each( (i,obj) => {
      if (obj.id == e.data.tab) {
        $(`#${obj.id}`).show();
      } else {
        $(`#${obj.id}`).hide();
      }
    });
  }

  _onBPMSliderInput(e) {
    this.score.bpm = e.target.value;
    this._updateScoreInfo();

    this.dispatchEvent(new CustomEvent("setBPM",
      {detail: {
        bpm: this.score.bpm,
      }}
    ));
  }

  _onBPMResetClicked(e) {
    this.score.bpm = this.score.originalbpm;
    this._updateScoreInfo();

    this.dispatchEvent(new CustomEvent("setBPM",
      {detail: {
        bpm: this.score.bpm,
      }}
    ));
  }

  _onTrackInstrumentClick(e) {
    const instrument = e.data.instrument;

    if (e.shiftKey) {
      this._soloInstrument(instrument, !instrument.solo());
      return;
    }

    if (instrument.solo())
      this._soloInstrument(instrument, !instrument.solo());
    else
      this._muteInstrument(instrument, !instrument.muted());
  }

  _muteInstrument(instrument, mute) {
    this.instrumentMgr.muteInstrument(instrument, mute);
    this._updateInstrumentStates();
  }

  _soloInstrument(instrument, solo) {
    this.instrumentMgr.soloInstrument(instrument, solo);
    this._updateInstrumentStates();
  }

  _updateInstrumentStates() {
    Object.values(this.instrumentMgr.all()).forEach(instrument => {
      $(`.track-${instrument.id}-mute`).each((index, item) => {
        if (instrument.audible())
          $(item).removeClass("muted");
        else
          $(item).addClass("muted");
      });

      $(`.track-${instrument.id}-solo`).each((index, item) => {
        if (instrument.solo())
          $(item).addClass("solo");
        else {
          $(item).removeClass("solo");
        }
      });
    });
  }

  _onInstrumentSamplePlay(e) {
    this.dispatchEvent(new CustomEvent("playSample",
      {detail: {
        instrumentId: e.data.instrumentId,
        sampleId: e.data.sampleId,
      }}
    ));
  }

  _updatePlayButtons(button, icon) {
    if (button.hasClass("active")) {
      // It's active -> Go to stopped mode
      $(`.play-button`).each((index, item) => {
        $(item).removeClass("disabled");
      });
      $(`.loop-button`).each((index, item) => {
        $(item).removeClass("disabled");
      });

      button.removeClass("active");
      icon.removeClass("active");
    } else {
      // It's inactive -> Go to playing mode
      $(`.play-button`).each((index, item) => {
        $(item).addClass("disabled");
      });
      $(`.loop-button`).each((index, item) => {
        $(item).addClass("disabled");
      });

      button.removeClass("disabled");
      button.addClass("active");
      icon.addClass("active");
    }
  }

  _onExtraStopButton(e) {
    this.dispatchEvent(new Event("stop"));
  }

  _onExtraPlayButton(e) {
    const playButton = $(`#extra-control-play-button`);
    const playIcon = $(`#extra-control-play-icon`);
    this.playMode = "score";
    this.playLoop = false;

    this.dispatchEvent(new CustomEvent("play",
      {detail: {
        mode: this.playMode,
        score: this.score,
        scoreSectionIndex: 0,
        loop: this.playLoop,
      }}
    ));

    this._updatePlayButtons(playButton, playIcon);
    playButton.addClass("disabled");
  }

  _onSectionPlayButton(e) {
    const section = e.data.section;
    const playButton = $(`#section-${section.id}-play-button`);
    const playIcon = $(`#section-${section.id}-play-button-icon`);
    this.playMode = "section";
    this.playLoop = false;

    if (playButton.hasClass("active")) {
      this.dispatchEvent(new Event("stop"));
    } else {
      this.dispatchEvent(new CustomEvent("play",
        {detail: {
          mode: this.playMode,
          score: this.score,
          section: section,
          loop: this.playLoop,
        }}
      ));
    }

    this._updatePlayButtons(playButton, playIcon);
  }

  _onSectionLoopButton(e) {
    const section = e.data.section;
    const loopButton = $(`#section-${section.id}-loop-button`);
    const loopIcon = $(`#section-${section.id}-loop-button-icon`);
    this.playMode = "section";
    this.playLoop = true;

    if (loopButton.hasClass("active")) {
      this.dispatchEvent(new Event("stop"));
    } else {
      this.dispatchEvent(new CustomEvent("play",
        {detail: {
          mode: this.playMode,
          score: this.score,
          section: section,
          loop: this.playLoop,
        }}
      ));
    }

    this._updatePlayButtons(loopButton, loopIcon);
  }

  _onScoreSectionPlayButton(e) {
    const scoreSectionIndex = e.data.scoreSectionIndex;
    const section = this.score.scoreSections[scoreSectionIndex];
    const playButton = $(`#score-section-${scoreSectionIndex}-${section.id}-play-button`);
    const playIcon = $(`#score-section-${scoreSectionIndex}-${section.id}-play-button-icon`);
    this.playMode = "score";
    this.playLoop = false;

    if (playButton.hasClass("active")) {
      this.dispatchEvent(new Event("stop"));
    } else {
      this.dispatchEvent(new CustomEvent("play",
        {detail: {
          mode: this.playMode,
          score: this.score,
          scoreSectionIndex: scoreSectionIndex,
          loop: this.playLoop,
        }}
      ));
    }

    this._updatePlayButtons(playButton, playIcon);
  }

  _onScoreSectionLoopButton(e) {
    const scoreSectionIndex = e.data.scoreSectionIndex;
    const section = this.score.scoreSections[scoreSectionIndex];
    const loopButton = $(`#score-section-${scoreSectionIndex}-${section.id}-loop-button`);
    const loopIcon = $(`#score-section-${scoreSectionIndex}-${section.id}-loop-button-icon`);
    this.playMode = "score";
    this.playLoop = true;

    if (loopButton.hasClass("active")) {
      this.dispatchEvent(new Event("stop"));
    } else {
      this.dispatchEvent(new CustomEvent("play",
        {detail: {
          mode: this.playMode,
          score: this.score,
          scoreSectionIndex: scoreSectionIndex,
          loop: this.playLoop,
        }}
      ));
    }

    this._updatePlayButtons(loopButton, loopIcon);
  }

  _onMinimapSectionClick(e) {
    const scoreSectionIndex = e.data.scoreSectionIndex;
    const section = this.score.scoreSections[scoreSectionIndex];
    const sectionOffset = this.score.getScoreSection16thOffset(scoreSectionIndex);

    this._onTabSelected({
      target: $("#tab-button-score"),
      data: { tab: "score-tab" },
    });

    if ($(e.target).hasClass("playing")) {
      this.dispatchEvent(new CustomEvent("jumpTo",
        {detail: {
          index: sectionOffset,
        }}
      ));
    }

    const sectionElm = $(`#score-section-${scoreSectionIndex}-${section.id}`);

    var currentXPos = sectionElm.offset().left
                    - $("#score-scrolling-content").offset().left
                    - this.PLAYER_BEAT_WIDTH_PIXELS;  // Leave a beat past current played note

    $("#score-scrolling-container").scrollLeft(currentXPos);
  }

  _onInstrumentVolumeIconClick(e) {
    const instrument = e.data.instrument;
    const slider = $(`#instrument-${instrument.id}-volume`);

    slider.val(0);
    this.dispatchEvent(new CustomEvent("changeInstrumentVolume",
      {detail: {
        instrumentId: instrument.id,
        volume: 0,
      }}
    ));
  }

  _onInstrumentVolumeSliderInput(e) {
    this.dispatchEvent(new CustomEvent("changeInstrumentVolume",
      {detail: {
        instrumentId: e.data.instrumentId,
        volume: e.target.value,
      }}
    ));
  }

  _onEditorApplyButton(e) {
    this.dispatchEvent(new CustomEvent("parse",
      {detail: {
        text: $("#score-editor-textbox").val()
      }}
    ));
  }

  _onEditorClipboardButton(e) {
    navigator.clipboard.writeText($("#score-editor-textbox").val());
  }

  _onEditorReloadButton(e) {
    this._onScoreSelectorInput();
  }

  // From: https://www.jqueryscript.net/text/reverse-text-background-color.html
  _adjustTextColor(DOMElem) {
    var backgroundColor = DOMElem.css("background-color");
    backgroundColor =  backgroundColor.split(',');
    const R = parseInt(backgroundColor[0].split('(')[1]);
    const G = parseInt(backgroundColor[1]);
    const B = parseInt(backgroundColor[2].split(')')[0]);
    const rPrime = R/255;
    const gPrime = G/255;
    const bPrime = B/255;
    const cMax = Math.max(rPrime, gPrime, bPrime);
    const cMin = Math.min(rPrime, gPrime, bPrime);
    var lightness = (cMax + cMin)/2;
    lightness >= 0.40 ? DOMElem.css("color", "black") : DOMElem.css("color", "white");
  }

}
