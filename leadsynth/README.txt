# LeadSynth.js

Single-voice "chiptune" synthesizer, like ReaSynth but with more features. Created by Sauraen, GPL licensed.

### Features
- All parameters controllable via MIDI (and automation, of course)
- Time and frequency paramters are on log scales, for easy programming over wide ranges
- Frequency LFO (vibrato) with programmable delay; depth assigned to mod wheel
- Time-based portamento (glide takes same length of time regardless of distance between notes)
- Six waveforms: saw, pulse (with pulse width control), triangle, 4-bit triangle (NES style), sine, and pitched noise
- Optional antialiasing on saw, pulse, and 4-bit triangle waveforms
- Standard ADSR, velocity sensitivity depth, and pitch bend with programmable range

### Installation
Download LeadSynth.js and put it in your Effects folder. (On my Windows 7 machine, this is at C:\Users\[username]\AppData\Roaming\REAPER\Effects.) Preferably, make a subfolder within the Effects folder for downloaded plugins. If REAPER doesn't find it immediately, restart REAPER. 
Tested most recently on REAPER 5.24, but should work on any version past 4.

### Contact
Send bug reports and feature requests to my name at Google's email.
