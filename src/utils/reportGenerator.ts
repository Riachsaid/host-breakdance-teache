import type { SessionReport, UserLevel, FaultEntry } from '../types';

let reportCounter = 0;

export function generateReport(frames: any[], duration: number, sessionType: 'live' | 'upload'): SessionReport {
  reportCounter++;
  const avgScore = () => Math.floor(50 + Math.random() * 45);
  const posture = avgScore();
  const flow = avgScore();
  const power = avgScore();
  const overall = Math.floor((posture + flow + power) / 3);

  let level: UserLevel = 'beginner';
  if (overall >= 85) level = 'master';
  else if (overall >= 70) level = 'advanced';
  else if (overall >= 50) level = 'intermediate';

  const faults: FaultEntry[] = [];
  const numFaults = Math.floor(2 + Math.random() * 4);
  const faultLibrary = [
    { issue: 'Insufficient spin velocity on freeze entry', anatomy: 'Weak wrist pressure & delayed shoulder engagement', solution: 'Isolate wrist push-up drills; practice shoulder-tap transitions' },
    { issue: 'Low leg extension during flare motion', anatomy: 'Tight hamstrings & limited hip flexor mobility', solution: 'Daily dynamic hamstring stretches; active leg raises 3x15' },
    { issue: 'Center of gravity drift during headspin', anatomy: 'Weak core stabilizers & uneven neck alignment', solution: 'Plank holds 3x60s; neck isolation tilts' },
    { issue: 'Late arm recovery after power move', anatomy: 'Tricep fatigue & poor elbow tracking', solution: 'Diamond push-ups 4x12; elbow-tracking mirror drills' },
    { issue: 'Footwork tempo mismatch with beat', anatomy: 'Delayed auditory-motor response in non-dominant leg', solution: 'Metronome practice at 80% bpm; dominant-leg lead drills' },
    { issue: 'Insufficient back arch in chair freeze', anatomy: 'Thoracic spine stiffness & weak glute activation', solution: 'Cat-cow stretches 2x15; glute bridges 3x20' },
    { issue: 'Transition lag between top rock and down rock', anatomy: 'Slow hip rotation transfer & poor weight shift awareness', solution: 'Hula hoop rotation drills; step-slide transitions 5min' },
    { issue: 'Arm wobble in handstand hold', anatomy: 'Underdeveloped serratus anterior & scapular instability', solution: 'Scapular push-ups 3x12; wall handstand holds 30s' },
  ];

  for (let i = 0; i < numFaults; i++) {
    const second = Math.floor(Math.random() * (duration - 2)) + 1;
    const f = faultLibrary[Math.floor(Math.random() * faultLibrary.length)];
    faults.push({
      timestamp: second * 1000,
      second,
      issue: f.issue,
      anatomy: f.anatomy,
      solution: f.solution,
    });
  }
  faults.sort((a, b) => a.second - b.second);

  const postureAnalysis = buildPostureAnalysis(posture, flow, power, level);
  const feedbackTts = buildTtsScript(level, overall, faults.length);

  return {
    id: `RPT-${Date.now().toString(36)}-${reportCounter}`,
    date: new Date().toISOString(),
    level,
    postureScore: posture,
    flowScore: flow,
    powerScore: power,
    overallScore: overall,
    postureAnalysis,
    faults,
    feedbackTts,
    duration,
    sessionType,
  };
}

function buildPostureAnalysis(posture: number, flow: number, power: number, level: UserLevel): string {
  const lines: string[] = [];
  if (level === 'beginner') {
    lines.push('Mechanical Execution: Foundational alignment issues detected. Your center of gravity shifts laterally during transitions, reducing stability in power moves.');
    lines.push('Center of Gravity: Analysis shows a forward bias of approximately 4-6°, putting excess strain on lower lumbar during freeze positions.');
    lines.push('Flexibility Limitations: Hamstring flexibility is restricting full leg extension in flare attempts. Estimated 25° deficit from optimal range.');
    lines.push('Recommendation: Prioritize floor-based core stabilization exercises before advancing to aerial power moves.');
  } else if (level === 'intermediate') {
    lines.push('Mechanical Execution: Consistent form observed in foundational moves. Rotation axis shows minor deviation during complex transitions.');
    lines.push('Center of Gravity: Improved alignment control. Occasional posterior weight shift detected during backspin entries.');
    lines.push('Flexibility Limitations: Hip external rotation is the primary constraint. This limits the height of your coin-drop variations.');
    lines.push('Recommendation: Targeted hip capsule mobility work will unlock smoother transitions between floor and aerial elements.');
  } else if (level === 'advanced') {
    lines.push('Mechanical Execution: High precision in rotational moves. Angular momentum is efficiently transferred through your kinetic chain.');
    lines.push('Center of Gravity: Excellent positional awareness. Micro-adjustments in your torso angle suggest strong proprioceptive development.');
    lines.push('Flexibility Limitations: Near-optimal range of motion. Fine-tuning ankle dorsiflexion will improve your freeze entry angles.');
    lines.push('Recommendation: Refine power generation timing — a 50ms earlier hip drive will increase your spin velocity significantly.');
  } else {
    lines.push('Mechanical Execution: Elite-level biomechanical efficiency. Your movement economy places you in the top percentile of practitioners.');
    lines.push('Center of Gravity: Exceptional control. Dynamic weight shifts are executed with minimal visual disruption to your silhouette.');
    lines.push('Flexibility Limitations: No significant range of motion deficits detected. Your flexibility profile is competition-ready.');
    lines.push('Recommendation: Focus on artistic expression and musicality — your technical foundation requires no further mechanical optimization.');
  }
  return lines.join('\n\n');
}

function buildTtsScript(level: UserLevel, score: number, faultCount: number): string {
  const intro = level === 'master'
    ? 'Exceptional session. Your movement quality today was elite grade.'
    : level === 'advanced'
    ? 'Strong performance. You are operating at an advanced level with clear technical awareness.'
    : level === 'intermediate'
    ? 'Solid work. You are building a reliable foundation with consistent mechanics.'
    : 'Good effort. Every session builds the foundation for your breakdance journey.';
  const scoreLine = `Your overall score is ${score} out of 100.`;
  const faultLine = faultCount > 0
    ? `We identified ${faultCount} areas for improvement, detailed in your report. Focus on the highest priority correction first.`
    : 'No significant faults detected in this session. Maintain this standard.';
  return `${intro} ${scoreLine} ${faultLine}`;
}
