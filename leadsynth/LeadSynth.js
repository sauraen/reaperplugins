//LeadSynth - Single-voice lead synthesizer
//Copyright (C) 2016 Sauraen
//Some code adapted from other REAPER plugins (C) 2004+ Cockos Inc.
//Licensed under the GPL - http://www.gnu.org/licenses/gpl.html
desc:LeadSynth - Single-voice lead synthesizer (Sauraen)

slider1:-12<-60,6,1>(CC 07) Volume (dB)
slider2:0<0,5,1{saw,pulse,triangle,4-bit triangle,sine,noise}>(CC 12) Oscillator
slider3:0<0,2,1{off,on}>(CC 13) Antialiasing
slider4:0.5<0.001,0.999,0.001>Pulse width (CC 70) PW
slider5:-1<-1,40,0.1>(log t: 0=1ms,) (CC 05) Porta TIME
slider6:7.3<0,10,0.1>(log Hz) (CC 76) Pitch LFO FRQ
slider7:-1<-1,30,0.1>(log cents) (CC 01 or 77) Pitch LFO AMP
slider8:-1<-1,40,0.1>(log t: 10=10ms,) (CC 78) Pitch LFO DLY
slider9:8<0,40,0.1>(log t: 20=100ms,) (CC 73) Amp EG ATK
slider10:30<0,40,0.1>(log t: 30=1sec,) (CC 75) Amp EG DEC
slider11:1<0,1,0.01>(%) (CC 79) Amp EG SUS
slider12:8<0,40,0.1>(log t: 40=10s) (CC 72) Amp EG REL
slider13:1<0,1,0.01>(CC 14) Velocity to amp
slider14:2<1,24,1>(CC 15) Pitch bend range

//WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW    INIT    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
@init

log2 = log(2.0);
twopi = 2.0 * $pi;

NOTE_OFF = 8;
NOTE_ON = 9;
MIDI_CC = 11;
MIDI_PITCH = 14;

CC_VOL = 7;
CC_WAVE = 12;
CC_AA = 13;
CC_PW = 70;
CC_PORTA = 5;
CC_PLFOFRQ = 76;
CC_PLFOAMP = 01;
CC_PLFOAMP2 = 77;
CC_PLFODLY = 78;
CC_ATK = 73;
CC_DEC = 75;
CC_SUS = 79;
CC_REL = 72;
CC_CUT = 74;
CC_VELAMP = 14;

TUNE_MIDINOTE = 69;
TUNE_PITCH = 440.0;

playing = 0;
pos = 0.0;
poslooped = 1.0;
egt = 0.0;
srateadd = 1.0 / srate;

midinote = 60;
velocity = 0;
lastnote = 60;
portadnote = 0.0;
plfodnote = 0.0;
benddnote = 0.0;
notenow = 0.0;

osc = 0.0;
lastosc = 0.0;
preaaosc = 0.0;


//WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW    SLIDER    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW

function changedsliders()(
  volfactor = 2 ^ (slider1 / 6);
  pw = twopi * slider4;
  (slider5 < 0) ? (
    portatime = 0;
  ) : (
    portatime = (10.0 ^ (slider5 / 10.0)) / 1000.0;
  );
  plfofrq = 10.0 ^ (slider6 / 10.0);
  (slider7 < 0) ? (
    plfoamphs = 0;
  ) : (
    plfoamphs = (10.0 ^ (slider7 / 10.0)) / 100.0;
  );
  (slider8 < 0) ? (
    plfodly = 0;
  ) : (
    plfodly = (10.0 ^ (slider8 / 10.0)) / 1000.0;
  );
  atkt = (10.0 ^ (slider9 / 10.0)) / 1000.0;
  dect = (10.0 ^ (slider10 / 10.0)) / 1000.0;
  suslvl = slider11;
  relt = (10.0 ^ (slider12 / 10.0)) / 1000.0;
);

@slider
changedsliders();

//WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW    BLOCK    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW

@block
while (
  input = midirecv(mpos, msg1, msg23);
  input  ? (
    statusHi = (msg1/16)|0;
    statusLo = (msg1-(statusHi*16))|0;
    data2 = (msg23/256)|0;
    data1 = (msg23-(data2*256))|0;
    
    ((statusHi == NOTE_OFF || (statusHi == NOTE_ON && data2 == 0)) && data1 == midinote) ? (
      //Note off
      playing = 0;
      vegt = 0.0;
      offvegfact = vegfact;
    );
    (statusHi == NOTE_ON) ? (
      //Note on
      (!playing) ? (
        midinote = data1;
        lastnote = midinote;
      ) : (
        lastnote = midinote;
        midinote = data1;
      );
      playing = 1;
      vegt = 0.0;
      portat = 0.0;
      plfot = 0.0;
      midinote = data1;
      velocity = data2;
    );
    (statusHi == MIDI_CC) ? (
      //CC change
      (data1 == CC_VOL) ? (
        slider1 = floor((data2 / 127.0) * 66.0 - 60.0);
      ) : (data1 == CC_WAVE) ? (
        slider2 = (data2 / 127.0) * 5.0;
      ) : (data1 == CC_AA) ? (
        slider3 = (data2 / 127.0);
      ) : (data1 == CC_PW) ? (
        slider4 = (data2 / 127.0) * 0.998 + 0.001;
      ) : (data1 == CC_PORTA) ? (
        slider5 = (data2 / 127.0) * 41.0 - 1.0;
      ) : (data1 == CC_PLFOFRQ) ? (
        slider6 = (data2 / 127.0) * 10.0;
      ) : (data1 == CC_PLFOAMP || data1 == CC_PLFOAMP2) ? (
        slider7 = (data2 / 127.0) * 31.0 - 1.0;
      ) : (data1 == CC_PLFODLY) ? (
        slider8 = (data2 / 127.0) * 41.0 - 1.0;
      ) : (data1 == CC_ATK) ? (
        slider9 = (data2 / 127.0) * 40.0;
      ) : (data1 == CC_DEC) ? (
        slider10 = (data2 / 127.0) * 40.0;
      ) : (data1 == CC_SUS) ? (
        slider11 = (data2 / 127.0);
      ) : (data1 == CC_REL) ? (
        slider12 = (data2 / 127.0) * 40.0;
      ) : (data1 == CC_VELAMP) ? (
        slider13 = (data2 / 127.0);
      );
      changedsliders();
    ) : (statusHi == MIDI_PITCH) ? (
      benddnote = slider14 * ((data2 / 64.0) + (data1 / 8192.0) - 1);
    );
  );
  input;
);


//WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW    SAMPLE    WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW

@sample

//==================================Calculate note overall playing

//midinote is set from @block

//Portamento
(portatime == 0) ? (
  portadnote = 0.0;
) : (
  portadnote = (lastnote - midinote) * (1 - (portat / portatime));
);
portat += srateadd;
(portat > portatime) ? (portat = portatime;);

//Pitch LFO
(plfot >= plfodly) ? (
  plfodnote = plfoamphs * sin(twopi * plfofrq * (plfot - plfodly));
) : (
  plfodnote = 0.0;
);
plfot += srateadd;

//Calculate final note
notenow = midinote + portadnote + plfodnote + benddnote;

//Calculate frequency
freq = TUNE_PITCH * (2 ^ ((notenow - TUNE_MIDINOTE) / 12.0));
deltat = twopi * freq / srate;

//Update position-within-wave
pos += deltat;
(pos >= twopi) ? (
  pos -= twopi;
  poslooped = 1;
) : (
  poslooped = 0;
);

//Generate waveform
lastosc = preaaosc;
(slider2 < 0.5) ? (
  //Saw
  osc = 1.0 - (pos / $pi);
) : (slider2 < 1.5) ? (
  //Pulse
  (pos > pw) ? (osc = 1.0;) : (osc = -1.0;);
) : (slider2 < 2.5) ? (
  //Triangle
  osc = (2.0 * pos / $pi) - 1.0;
  (osc > 1.0) ? osc = 2.0-osc;
) : (slider2 < 3.5) ? (
  //NES Triangle
  osc = (8.0 * pos / $pi);
  osc = floor(osc);
  steposc = osc * $pi / 8.0;
  osc = (osc / 4.0) - 1.0;
  (osc >= 1.0) ? osc = 2.0-osc;
) : (slider2 < 4.5) ? (
  //Sine
  osc = sin(pos);
) : (
  //Noise
  (poslooped) ? (
    osc = rand() - 0.5;
  ) : (
    osc = lastosc;
  );
);

//Clip waveform in case something not behaving
(osc > 1) ? (osc = 1;);
(osc < -1) ? (osc = -1;);

preaaosc = osc;

//Antialiasing
(slider3 > 0.5) ? (
  (slider2 < 0.5) ? (
    //Saw
    (poslooped) ? (
      ratio = (pos / deltat);
      osc = (ratio * (osc + 1.0)) - 1.0;
    );
  ) : (slider2 < 1.5) ? (
    //Pulse
    (abs(osc - lastosc) > 0.001) ? (
      (osc >= 0) ? (
        ratio = (pos - pw) / deltat;
        osc = (ratio * 2.0) - 1.0;
      ) : (
        ratio = pos / deltat;
        osc = (ratio * -2.0) + 1.0;
      );
    );
  ) : (slider2 >= 2.5 && slider2 < 3.5) ? (
    //NES Triangle
    (abs(osc - lastosc) > 0.001) ? (
      ratio = (pos - steposc) / deltat;
      osc = (ratio * (osc - lastosc)) + lastosc;
    );
  ); //Nothing for triangle, sine, or noise
);

//========================================Oscillator amplitude factors

//Envelope
(playing) ? (
  (vegt < atkt) ? (
    vegpercent = vegt / atkt;
    vegfact = vegpercent;
  ) : (
    vegpercent = (vegt - atkt) / dect;
    (vegpercent > 1.0) ? (vegpercent = 1.0;);
    vegfact = (vegpercent * (suslvl - 1)) + 1;
  );
) : (
  vegpercent = vegt / relt;
  (vegpercent > 1.0) ? (vegpercent = 1.0;);
  vegfact = (vegpercent * (0 - offvegfact)) + offvegfact;
);
osc *= vegfact;
vegt += srateadd;

//Velocity sensitivity
velfact = (1 - (1 - (velocity / 127.0)) * slider13);
osc *= velfact;

//Total volume
osc *= volfactor;

//Output
spl0 = osc + spl0;
spl1 = osc + spl1;
