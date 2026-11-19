export type LrcLine = {
  time: number;
  text: string;
  words?: { time: number; word: string }[];
};

const TIME_RE = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/;
const WORD_TAG_RE = /<(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?>(\S+)/g;
const TAG_RE = /<(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?>/g;

function parseTime(min: string, sec: string, fracStr: string | undefined, offset = 0): number {
  const frac = parseInt((fracStr ?? "0").padEnd(3, "0"), 10) / 1000;
  return parseInt(min, 10) * 60 + parseInt(sec, 10) + frac + offset;
}

export function parseLrc(content: string, offset = 0): LrcLine[] {
  const lines: LrcLine[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const m = raw.match(TIME_RE);
    if (!m) continue;
    const time = parseTime(m[1], m[2], m[3], offset);
    const rawText = m[4].trim();
    if (rawText === "") continue;

    // Extract inline word tags <mm:ss.xx>word
    const words: { time: number; word: string }[] = [];
    let wMatch: RegExpExecArray | null;
    while ((wMatch = WORD_TAG_RE.exec(rawText)) !== null) {
      words.push({ time: parseTime(wMatch[1], wMatch[2], wMatch[3], offset), word: wMatch[4] });
    }

    // Remove all timestamp tags, keep the words
    const cleanText = rawText.replace(TAG_RE, " ").trim().replace(/\s+/g, " ");

    lines.push({ time, text: cleanText, words: words.length > 0 ? words : undefined });
  }
  lines.sort((a, b) => a.time - b.time);
  return lines;
}

export function findActiveLineIndex(lines: LrcLine[], currentTime: number): number {
  if (lines.length === 0) return -1;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) idx = i;
    else break;
  }
  return idx;
}

// Demo LRC lyrics for tracks (clearly labeled as demo)
export const DEMO_LYRICS: Record<string, string> = {
  t1: `[00:00.00] Welcome to your little paradise
[00:08.50] Where the music never fades
[00:16.20] Close your eyes and let it take you
[00:24.80] To a place beyond the haze
[00:33.40] Every note a gentle sunrise
[00:41.90] Every beat a quiet sea
[00:50.60] You are home, you are home
[00:59.20] In your little paradise
[01:08.00] Drift away on silver melodies
[01:16.50] Let the world just fade to blue
[01:25.10] There is nothing left to worry
[01:33.70] There is only me and you
[01:42.30] Every note a gentle sunrise
[01:50.90] Every beat a quiet sea
[01:59.60] You are home, you are home
[02:08.20] In your little paradise`,
  t2: `[00:00.00] Starlit lullaby
[00:09.00] Sing me to the sky
[00:18.00] Hold me in the quiet
[00:27.00] Where the shadows lie
[00:36.00] Dreams are made of starlight
[00:45.00] Soft and silver bright
[00:54.00] Close your eyes and listen
[01:03.00] To the night
[01:12.00] Starlit lullaby
[01:21.00] Carry me away
[01:30.00] To a world of wonder
[01:39.00] At the break of day`,
  t3: `[00:00.00] Neon drift
[00:10.00] City lights in the mist
[00:20.00] We are moving through the night
[00:30.00] Chasing something we might miss
[00:40.00] Neon drift
[00:50.00] Hearts in overdrive
[01:00.00] Let the rhythm take control
[01:10.00] Let the feeling come alive
[01:20.00] Neon drift
[01:30.00] We are infinite tonight`,
  t4: `[00:00.00] Ocean pulse
[00:12.00] Waves against the shore
[00:24.00] Breathing with the tide
[00:36.00] Always coming back for more
[00:48.00] Ocean pulse
[01:00.00] Deep and blue and wide
[01:12.00] Let the water carry you
[01:24.00] To the other side`,
  t5: `[00:00.00] Golden hour
[00:14.00] Light upon your face
[00:28.00] Everything is softer now
[00:42.00] In this quiet place
[00:56.00] Golden hour
[01:10.00] Hold it while you can
[01:24.00] Moments like a melody
[01:38.00] Slip right through your hand`,
  t6: `[00:00.00] Echoes of you
[00:13.00] In every room I walk
[00:26.00] In every song I hear
[00:39.00] In every breath I talk
[00:52.00] Echoes of you
[01:05.00] Will never fade away
[01:18.00] You are the melody
[01:31.00] That in my heart will stay`,
  t7: `[00:00.00] Hey, Nate, how's life?
[00:04.00] I don't know, it's alright
[00:08.00] I've been dealin' with some things like every human being
[00:13.00] And really didn't sleep much last night
[00:18.00] I'm sorry, that's fine
[00:21.00] I just think I need a little me time
[00:26.00] I just think I need a little free time
[00:30.00] Little break from the shows and the bus rides
[00:35.00] Last year I had a breakdown
[00:40.00] Thoughts tellin' me I'm lost gettin' too loud
[00:45.00] Had to see a therapist, then I found out
[00:50.00] Somethin' funny's goin' on up in my house
[00:55.00] Yeah, I started thinkin' maybe I should move out
[01:00.00] You know, pack my cart, take a new route
[01:05.00] Clean up my yard, get the noose out
[01:10.00] Hang up my heart, let it air out
[01:15.00] I've been searchin'
[01:20.00] What does that mean, Nate?
[01:25.00] I've been learning
[01:30.00] Grabbin' my keepsakes, leavin' my burdens
[01:35.00] Well, I brought a few with me, I'm not perfect
[01:40.00] Lookin' at the view like, this concerns me
[01:45.00] Pickin' up the cues, right? I'm quite nervous
[01:50.00] Hate it when I lose sight, life gets blurry
[01:55.00] And things might hurt me
[02:00.00] It's prolly gonna be a long journey, but hey
[02:05.00] It's worth it, though
[02:10.00] Cold world out there, kids, grab your coats
[02:10.00] Been a minute, I know, now I'm back to roam
[02:15.00] Lookin' for the antidote to crack the code
[02:20.00] Pretty vivid, I admit it, I'm in classic mode
[02:25.00] Don't need pity given to me, but I can't condone
[02:30.00] Talkin' down to me, I'ma have to crack your nose for crackin' jokes
[02:35.00] I'm lookin' for the map to hope, you seen it?
[02:40.00] Been makin' a whole lot of changes
[02:45.00] Wrote a song about that, you should play it
[02:50.00] I get scared when I walk on these stages
[02:55.00] I look at the crowd and see so many faces, yeah
[03:00.00] That's when I start to get anxious
[03:05.00] That's when my thoughts can be dangerous
[03:10.00] That's when I put on my makeup and drown in self-hatred
[03:15.00] Forget what I'm saying, and
[03:20.00] Where'd the beat go?
[03:22.00] Oh, ain't that somethin'?
[03:25.00] Drums came in, you ain't see that comin'
[03:28.00] Hands on my head, can't tell me nothin'
[03:31.00] Got a taste of the fame, had to pump my stomach
[03:34.00] Throw it back up like I don't want it
[03:37.00] Wipe my face, clean up my vomit
[03:40.00] OCD, tryna push my buttons
[03:43.00] I said don't touch it, now y'all done it`,
};
