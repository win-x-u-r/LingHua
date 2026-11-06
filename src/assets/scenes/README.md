# Scene voices

Recorded lines for the lesson scenes, one ElevenLabs voice per character.

Name each file after the lesson key (dots become dashes) and the line number
in the scene, counted from 01:

- `m1-u1-l1-01.mp3` is line 1 of Mandarin on the Move lesson `m1.u1.l1`
- `f1-u1-l3-02.mp3` is line 2 of Foundation 1 lesson `f1.u1.l3`

Any MP3 here is picked up by the next build (see `src/components/learn/audio.ts`).
Lines without a file keep the device voice, or Hua's voice for Hua's lines.
Record a whole scene at once so voices don't switch mid-scene.
