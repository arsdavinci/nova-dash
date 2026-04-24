/**
 * SoundManager — 宇宙シューティング SPACE SHUTTLE
 * サウンド部 / Synapse Enterprise
 *
 * Web Audio API のみで SE・BGM を合成。外部音声ファイル不使用。
 * ブラウザ自動再生ポリシー対応: constructor では suspended のまま保持。
 * ユーザー操作時に resume() を呼んでから音を出す。
 *
 * 公開インターフェース:
 *   new SoundManager()
 *   .resume()                  — AudioContext を resume（ユーザー操作時）
 *   .playBGM()                 — BGM ループ再生開始
 *   .stopBGM()                 — BGM 停止
 *   .playSE(name)              — SE 再生 ('shoot'|'explosion'|'playerHit'|'gameover'|'clear')
 *   .setVolume(level)          — マスター音量 0.0〜1.0
 */

class SoundManager {
  constructor() {
    // Safari 対応: webkitAudioContext フォールバック
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this._ctx = new AudioContextClass();

    // マスターゲイン (デフォルト 0.5)
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.setValueAtTime(0.5, this._ctx.currentTime);
    this._masterGain.connect(this._ctx.destination);

    // BGM 管理
    this._bgmNodes = [];        // 停止時に stop() する全ノード
    this._isBgmPlaying = false;
    this._bgmLoopTimeout = null; // ループ用 setTimeout id
  }

  // ────────────────────────────────────────────────
  // 公開メソッド
  // ────────────────────────────────────────────────

  /** AudioContext を resume する。ユーザーの最初の操作ハンドラで呼ぶ。 */
  resume() {
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  /** BGM をループ再生開始。既に再生中なら何もしない。 */
  playBGM() {
    if (this._isBgmPlaying) return;
    this._isBgmPlaying = true;
    this._startBGM();
  }

  /** BGM を停止する。 */
  stopBGM() {
    if (!this._isBgmPlaying) return;
    this._isBgmPlaying = false;
    if (this._bgmLoopTimeout !== null) {
      clearTimeout(this._bgmLoopTimeout);
      this._bgmLoopTimeout = null;
    }
    this._stopBGMNodes();
  }

  /**
   * SE を再生する。
   * @param {string} name 'shoot' | 'explosion' | 'playerHit' | 'gameover' | 'clear'
   */
  playSE(name) {
    switch (name) {
      case 'shoot':      this._playShoot();      break;
      case 'explosion':  this._playExplosion();  break;
      case 'playerHit':  this._playPlayerHit();  break;
      case 'gameover':   this._playGameover();   break;
      case 'clear':      this._playClear();      break;
      default:
        console.warn('[SoundManager] 不明な SE 名:', name);
    }
  }

  /**
   * マスター音量を設定する。
   * @param {number} level 0.0〜1.0
   */
  setVolume(level) {
    const clamped = Math.max(0, Math.min(1, level));
    this._masterGain.gain.setValueAtTime(clamped, this._ctx.currentTime);
  }

  // ────────────────────────────────────────────────
  // BGM 内部メソッド
  // ────────────────────────────────────────────────

  /**
   * BGM の1ループ(16秒)分を現在時刻からスケジューリングして開始する。
   * 16秒後に再帰的に呼び出してループを実現する。
   */
  _startBGM() {
    const ctx = this._ctx;
    const t0 = ctx.currentTime + 0.05; // 少し余裕を持って開始
    const LOOP_DURATION = 16.0; // 8小節 × 2秒/小節

    // BPM=120, 4/4拍子 → 1拍=0.5秒, 1小節=2.0秒
    const BPM = 120;
    const BEAT = 60 / BPM;       // 0.5秒
    const BAR = BEAT * 4;        // 2.0秒

    this._scheduleBassLayer(t0, BAR, LOOP_DURATION);
    this._scheduleLeadLayer(t0, BEAT, BAR, LOOP_DURATION);
    this._schedulePadLayer(t0, BAR, LOOP_DURATION);
    this._scheduleRhythmLayer(t0, BEAT, LOOP_DURATION);

    // 次のループをスケジュール（16秒後）
    this._bgmLoopTimeout = setTimeout(() => {
      if (this._isBgmPlaying) {
        this._stopBGMNodes();
        this._startBGM();
      }
    }, (LOOP_DURATION - 0.2) * 1000); // 少し早めに次を準備
  }

  /**
   * Bass レイヤー: sawtooth, 65〜130 Hz、4分音符でルート音を刻む
   * 音列: Cm×4拍 Ab×4拍 Bb×4拍 Cm×4拍 Ab×4拍 Bb×4拍 Cm×4拍 Cm×4拍
   * ゲイン: 0.15
   */
  _scheduleBassLayer(t0, BAR, totalDuration) {
    const BEAT = BAR / 4;
    const GAIN = 0.15;
    // 8小節のルート周波数 (Hz)
    // Cm=C3(65Hz), Ab=Ab2(52Hz), Bb=Bb2(58Hz)
    const pattern = [65, 65, 65, 65, 52, 52, 52, 52, 58, 58, 58, 58, 65, 65, 65, 65,
                     52, 52, 52, 52, 58, 58, 58, 58, 65, 65, 65, 65, 65, 65, 65, 65];

    for (let i = 0; i < pattern.length; i++) {
      const t = t0 + i * BEAT;
      if (t - t0 >= totalDuration) break;
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pattern[i], t);

      // 短いエンベロープ: attack ほぼゼロ, decay で音量0.15まで
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(GAIN, t + 0.01);
      gain.gain.setValueAtTime(GAIN, t + BEAT * 0.8);
      gain.gain.linearRampToValueAtTime(0, t + BEAT * 0.95);

      osc.connect(gain);
      gain.connect(this._masterGain);
      osc.start(t);
      osc.stop(t + BEAT);
      this._bgmNodes.push(osc, gain);
    }
  }

  /**
   * Lead レイヤー: square, 260〜520 Hz、シンプルな反復フレーズ
   * Cマイナースケール: C4(262), D4(294), Eb4(311), F4(349), G4(392), Ab4(415), Bb4(466)
   * ゲイン: 0.12
   */
  _scheduleLeadLayer(t0, BEAT, BAR, totalDuration) {
    const GAIN = 0.12;
    const HALF = BEAT / 2;
    // Cマイナースケール音列モチーフ (2小節=8拍=16音で構成し4回繰り返す)
    // 周波数と音価([freq, duration_in_beat_units])
    const motif = [
      [262, 0.5], [294, 0.5], [311, 1.0], [262, 0.5],
      [294, 0.5], [349, 1.0], [311, 0.5], [294, 0.5],
      [262, 1.0], [311, 0.5], [349, 0.5], [392, 1.0],
      [349, 0.5], [311, 0.5], [294, 1.0], [262, 1.0],
    ]; // 合計 10拍 = 2.5小節 — 2ループで5小節、微調整で8小節に収める

    // 8小節分(32拍)のフレーズを展開
    const fullPhrase = [];
    while (fullPhrase.reduce((s, n) => s + n[1], 0) < 32) {
      for (const note of motif) {
        fullPhrase.push(note);
        if (fullPhrase.reduce((s, n) => s + n[1], 0) >= 32) break;
      }
    }

    let cursor = 0;
    for (const [freq, durBeats] of fullPhrase) {
      const t = t0 + cursor * BEAT;
      if (t - t0 >= totalDuration) break;
      const noteDur = durBeats * BEAT;

      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(GAIN, t + 0.01);
      gain.gain.setValueAtTime(GAIN * 0.8, t + noteDur * 0.6);
      gain.gain.linearRampToValueAtTime(0, t + noteDur * 0.9);

      osc.connect(gain);
      gain.connect(this._masterGain);
      osc.start(t);
      osc.stop(t + noteDur);
      this._bgmNodes.push(osc, gain);

      cursor += durBeats;
      if (cursor >= 32) break;
    }
  }

  /**
   * Pad レイヤー: sine, 130〜260 Hz、LFO ビブラート付き
   * 和音進行: Cm→Ab→Bb×2ループ（各2小節）
   * ゲイン: 0.08
   */
  _schedulePadLayer(t0, BAR, totalDuration) {
    const GAIN = 0.08;
    // Cm: C3(131), Eb3(156), G3(196)
    // Ab: Ab3(208)→実際は Ab2(104), C3(131), Eb3(156)
    // Bb: Bb2(117), D3(147), F3(175)
    const chords = [
      { freqs: [131, 156, 196], bars: 2 },
      { freqs: [104, 131, 156], bars: 2 },
      { freqs: [117, 147, 175], bars: 2 },
      { freqs: [131, 156, 196], bars: 2 },
    ];

    let cursor = 0;
    for (const chord of chords) {
      const t = t0 + cursor * BAR;
      const dur = chord.bars * BAR;

      for (const freq of chord.freqs) {
        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();

        // LFO: 4Hz, ±2Hz のビブラート
        const lfo = this._ctx.createOscillator();
        const lfoGain = this._ctx.createGain();
        lfo.frequency.setValueAtTime(4, t);
        lfoGain.gain.setValueAtTime(2, t);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(GAIN, t + 0.2);
        gain.gain.setValueAtTime(GAIN, t + dur - 0.3);
        gain.gain.linearRampToValueAtTime(0, t + dur);

        osc.connect(gain);
        gain.connect(this._masterGain);

        lfo.start(t);
        lfo.stop(t + dur);
        osc.start(t);
        osc.stop(t + dur);
        this._bgmNodes.push(osc, gain, lfo, lfoGain);
      }
      cursor += chord.bars;
    }
  }

  /**
   * Rhythm レイヤー: ノイズベースのキック・スネア
   * 4/4: 1・3拍 = kick(lowpass noise), 2・4拍 = snare(bandpass noise)
   * ゲイン: 0.10
   */
  _scheduleRhythmLayer(t0, BEAT, totalDuration) {
    const totalBeats = Math.floor(totalDuration / BEAT);
    for (let i = 0; i < totalBeats; i++) {
      const t = t0 + i * BEAT;
      if (t - t0 >= totalDuration) break;
      const isKick = (i % 4 === 0 || i % 4 === 2);
      this._schedulePercussion(t, isKick);
    }
  }

  /**
   * パーカッション1発をスケジュールする
   * @param {number} t 開始時刻
   * @param {boolean} isKick true=kick(lowpass), false=snare(bandpass)
   */
  _schedulePercussion(t, isKick) {
    const ctx = this._ctx;
    const dur = 0.12;
    const buf = this._createNoiseBuffer(dur);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    if (isKick) {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, t);
    } else {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000, t);
      filter.Q.setValueAtTime(1.0, t);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.10, t);
    gain.gain.linearRampToValueAtTime(0, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this._masterGain);
    src.start(t);
    src.stop(t + dur);
    this._bgmNodes.push(src, filter, gain);
  }

  /** BGM 全ノードを stop して配列をクリアする */
  _stopBGMNodes() {
    const t = this._ctx.currentTime;
    for (const node of this._bgmNodes) {
      try {
        if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
          node.stop(t);
        }
        node.disconnect();
      } catch (_) {
        // 既に停止済みのノードは無視
      }
    }
    this._bgmNodes = [];
  }

  // ────────────────────────────────────────────────
  // SE 内部メソッド
  // ────────────────────────────────────────────────

  /**
   * shoot: square 1200→800 Hz, 40ms
   * 仕様書 §2-2 準拠
   */
  _playShoot() {
    const ctx = this._ctx;
    const t = ctx.currentTime;
    const dur = 0.04;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.linearRampToValueAtTime(800, t + dur);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + dur);

    osc.connect(gain);
    gain.connect(this._masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.005);
  }

  /**
   * explosion: white noise + lowpass(1000Hz), ADSR 0.005/0.1/0.3/0.3, 合計0.4秒
   * 仕様書 §2-3 準拠
   */
  _playExplosion() {
    const ctx = this._ctx;
    const t = ctx.currentTime;
    const totalDur = 0.405; // attack+decay+sustain_time+release ≈ 0.4s

    const buf = this._createNoiseBuffer(totalDur);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);

    const gain = ctx.createGain();
    // ADSR: A=0.005s, D=0.1s, S=0.3 (gainレベル), R=0.3s
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1.0, t + 0.005);        // Attack → peak
    gain.gain.linearRampToValueAtTime(0.3, t + 0.005 + 0.1);  // Decay → sustain level
    gain.gain.setValueAtTime(0.3, t + 0.005 + 0.1);           // Sustain 開始
    gain.gain.linearRampToValueAtTime(0, t + totalDur);        // Release

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this._masterGain);
    src.start(t);
    src.stop(t + totalDur + 0.01);
  }

  /**
   * playerHit: sawtooth 400→150 Hz, 0.25秒
   * ADSR: A=0.005s, D=0.05s, S=0.4, R=0.2s
   * 仕様書 §2-4 準拠
   */
  _playPlayerHit() {
    const ctx = this._ctx;
    const t = ctx.currentTime;
    const dur = 0.25;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(150, t + dur);

    // ADSR
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.005);        // Attack
    gain.gain.linearRampToValueAtTime(0.4, t + 0.055);        // Decay → Sustain
    gain.gain.setValueAtTime(0.4, t + dur - 0.2);             // Sustain 保持
    gain.gain.linearRampToValueAtTime(0, t + dur);            // Release

    osc.connect(gain);
    gain.connect(this._masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  /**
   * gameover: sine 3音アルペジオ（440→330→220Hz）
   * 各音 0.35秒, 間隔 0.3秒スタート, 合計 ~1.0秒
   * ADSR per note: A=0.01s, D=0.1s, S=0.6, R=0.2s
   * 仕様書 §2-5 準拠
   */
  _playGameover() {
    const ctx = this._ctx;
    const t = ctx.currentTime;
    const freqs = [440, 330, 220];
    const interval = 0.3; // 各音の開始間隔
    const noteDur = 0.35;

    freqs.forEach((freq, i) => {
      const ts = t + i * interval;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ts);

      gain.gain.setValueAtTime(0, ts);
      gain.gain.linearRampToValueAtTime(0.6, ts + 0.01);      // Attack
      gain.gain.linearRampToValueAtTime(0.36, ts + 0.11);     // Decay → S=0.6 * 0.6
      gain.gain.setValueAtTime(0.36, ts + noteDur - 0.2);     // Sustain
      gain.gain.linearRampToValueAtTime(0, ts + noteDur);     // Release

      osc.connect(gain);
      gain.connect(this._masterGain);
      osc.start(ts);
      osc.stop(ts + noteDur + 0.01);
    });
  }

  /**
   * clear: square 上昇アルペジオ（523→659→784→1047Hz）
   * 各音 0.25秒, 最終音 0.4秒、間隔 0.25秒スタート
   * ADSR per note: A=0.01s, D=0.05s, S=0.7, R=0.15s（最終音は R=0.3s）
   * 仕様書 §2-6 準拠
   */
  _playClear() {
    const ctx = this._ctx;
    const t = ctx.currentTime;
    const freqs = [523, 659, 784, 1047];
    const interval = 0.25;

    freqs.forEach((freq, i) => {
      const ts = t + i * interval;
      const isLast = (i === freqs.length - 1);
      const noteDur = isLast ? 0.4 : 0.25;
      const release = isLast ? 0.3 : 0.15;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ts);

      gain.gain.setValueAtTime(0, ts);
      gain.gain.linearRampToValueAtTime(0.5, ts + 0.01);           // Attack
      gain.gain.linearRampToValueAtTime(0.35, ts + 0.06);          // Decay → S=0.7
      gain.gain.setValueAtTime(0.35, ts + noteDur - release);      // Sustain
      gain.gain.linearRampToValueAtTime(0, ts + noteDur);          // Release

      osc.connect(gain);
      gain.connect(this._masterGain);
      osc.start(ts);
      osc.stop(ts + noteDur + 0.01);
    });
  }

  // ────────────────────────────────────────────────
  // ユーティリティ
  // ────────────────────────────────────────────────

  /**
   * ホワイトノイズの AudioBuffer を生成して返す
   * @param {number} duration 秒
   * @returns {AudioBuffer}
   */
  _createNoiseBuffer(duration) {
    const ctx = this._ctx;
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.ceil(sampleRate * duration);
    const buf = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  /**
   * 単音スケジューリングのヘルパー
   * @param {number} freq      周波数 (Hz)
   * @param {string} wave      'sine'|'square'|'sawtooth'|'triangle'
   * @param {number} start     開始時刻 (AudioContext.currentTime 基準)
   * @param {number} duration  持続時間 (秒)
   * @param {number} gain      最大ゲイン
   */
  _scheduleNote(freq, wave, start, duration, gain) {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);

    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(gain, start + 0.01);
    gainNode.gain.setValueAtTime(gain, start + duration * 0.7);
    gainNode.gain.linearRampToValueAtTime(0, start + duration);

    osc.connect(gainNode);
    gainNode.connect(this._masterGain);
    osc.start(start);
    osc.stop(start + duration + 0.01);
    return { osc, gainNode };
  }
}

// ────────────────────────────────────────────────
// エクスポート: window グローバル + CommonJS 両対応
// ────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundManager;
}
if (typeof window !== 'undefined') {
  window.SoundManager = SoundManager;
}
