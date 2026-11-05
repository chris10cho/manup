// Builds src/data/exercises.json: a curated subset of yuhonas/free-exercise-db
// Usage: node scripts/build-library.mjs <path-to-exercises.json>
import fs from 'node:fs';

const src = process.argv[2];
if (!src) throw new Error('pass path to free-exercise-db exercises.json');
const db = JSON.parse(fs.readFileSync(src, 'utf8'));
const byId = new Map(db.map((e) => [e.id, e]));

// [id, kind, pattern, equip]
// kind: lift | bodyweight | core | cardio | mobility
// equip: gym (barbell/machine/cable rack access) | dumbbell | bodyweight | bands | kettlebell | cardio-machine | none
const curated = [
  // squat
  ['Barbell_Squat', 'lift', 'squat', 'gym'],
  ['Goblet_Squat', 'lift', 'squat', 'dumbbell'],
  ['Leg_Press', 'lift', 'squat', 'gym'],
  ['Split_Squat_with_Dumbbells', 'lift', 'lunge', 'dumbbell'],
  ['Dumbbell_Lunges', 'lift', 'lunge', 'dumbbell'],
  ['Dumbbell_Step_Ups', 'lift', 'lunge', 'dumbbell'],
  ['Bodyweight_Walking_Lunge', 'bodyweight', 'lunge', 'bodyweight'],
  ['Split_Squats', 'bodyweight', 'lunge', 'bodyweight'],
  ['Leg_Extensions', 'lift', 'quads', 'gym'],
  // hinge / posterior
  ['Barbell_Deadlift', 'lift', 'hinge', 'gym'],
  ['Romanian_Deadlift', 'lift', 'hinge', 'gym'],
  ['One-Arm_Kettlebell_Swings', 'lift', 'hinge', 'kettlebell'],
  ['Lying_Leg_Curls', 'lift', 'hamstrings', 'gym'],
  ['Barbell_Hip_Thrust', 'lift', 'glute', 'gym'],
  ['Single_Leg_Glute_Bridge', 'bodyweight', 'glute', 'bodyweight'],
  ['Band_Good_Morning', 'lift', 'hinge', 'bands'],
  // horizontal push
  ['Barbell_Bench_Press_-_Medium_Grip', 'lift', 'hpush', 'gym'],
  ['Dumbbell_Bench_Press', 'lift', 'hpush', 'dumbbell'],
  ['Incline_Dumbbell_Press', 'lift', 'hpush', 'dumbbell'],
  ['Pushups', 'bodyweight', 'hpush', 'bodyweight'],
  ['Incline_Push-Up', 'bodyweight', 'hpush', 'bodyweight'],
  // vertical push
  ['Standing_Military_Press', 'lift', 'vpush', 'gym'],
  ['Dumbbell_Shoulder_Press', 'lift', 'vpush', 'dumbbell'],
  // horizontal pull
  ['Bent_Over_Barbell_Row', 'lift', 'hpull', 'gym'],
  ['One-Arm_Dumbbell_Row', 'lift', 'hpull', 'dumbbell'],
  ['Seated_Cable_Rows', 'lift', 'hpull', 'gym'],
  ['Band_Pull_Apart', 'lift', 'hpull', 'bands'],
  // vertical pull
  ['Pullups', 'bodyweight', 'vpull', 'bodyweight'],
  ['Chin-Up', 'bodyweight', 'vpull', 'bodyweight'],
  ['Wide-Grip_Lat_Pulldown', 'lift', 'vpull', 'gym'],
  // shoulders / arms
  ['Side_Lateral_Raise', 'lift', 'delts', 'dumbbell'],
  ['Face_Pull', 'lift', 'delts', 'gym'],
  ['Reverse_Flyes', 'lift', 'delts', 'dumbbell'],
  ['Dumbbell_Bicep_Curl', 'lift', 'arms', 'dumbbell'],
  ['Barbell_Curl', 'lift', 'arms', 'gym'],
  ['Triceps_Pushdown', 'lift', 'arms', 'gym'],
  ['Bench_Dips', 'bodyweight', 'arms', 'bodyweight'],
  // calves / core
  ['Calf_Raise_On_A_Dumbbell', 'lift', 'calf', 'dumbbell'],
  ['Plank', 'core', 'core', 'bodyweight'],
  ['Hanging_Leg_Raise', 'core', 'core', 'bodyweight'],
  ['Russian_Twist', 'core', 'core', 'bodyweight'],
  ['Cable_Crunch', 'core', 'core', 'gym'],
  ['Mountain_Climbers', 'core', 'core', 'bodyweight'],
  // cardio
  ['Jogging_Treadmill', 'cardio', 'cardio', 'cardio-machine'],
  ['Running_Treadmill', 'cardio', 'cardio', 'cardio-machine'],
  ['Walking_Treadmill', 'cardio', 'cardio', 'cardio-machine'],
  ['Rowing_Stationary', 'cardio', 'cardio', 'cardio-machine'],
  ['Bicycling_Stationary', 'cardio', 'cardio', 'cardio-machine'],
  ['Elliptical_Trainer', 'cardio', 'cardio', 'cardio-machine'],
  ['Rope_Jumping', 'cardio', 'cardio', 'none'],
  ['Trail_Running_Walking', 'cardio', 'cardio', 'none'],
  // mobility / stretch
  ['Cat_Stretch', 'mobility', 'stretch', 'none'],
  ['Childs_Pose', 'mobility', 'stretch', 'none'],
  ['Worlds_Greatest_Stretch', 'mobility', 'stretch', 'none'],
  ['Hamstring_Stretch', 'mobility', 'stretch', 'none'],
  ['Intermediate_Hip_Flexor_and_Quad_Stretch', 'mobility', 'stretch', 'none'],
  ['Chest_And_Front_Of_Shoulder_Stretch', 'mobility', 'stretch', 'none'],
  ['Shoulder_Stretch', 'mobility', 'stretch', 'none'],
  // --- added for bench + muscle-up plan ---
  ['Barbell_Incline_Bench_Press_-_Medium_Grip', 'lift', 'hpush', 'gym'],
  ['Floor_Press', 'lift', 'hpush', 'gym'],
  ['Pin_Presses', 'lift', 'hpush', 'gym'],
  ['Dumbbell_Floor_Press', 'lift', 'hpush', 'dumbbell'],
  ['Weighted_Bench_Dip', 'lift', 'arms', 'dumbbell'],
  ['Cable_Rope_Overhead_Triceps_Extension', 'lift', 'arms', 'gym'],
  ['Hammer_Curls', 'lift', 'arms', 'dumbbell'],
  ['Muscle_Up', 'bodyweight', 'skill', 'bodyweight'],
  ['Gironda_Sternum_Chins', 'bodyweight', 'vpull', 'bodyweight'],
  ['Inverted_Row', 'bodyweight', 'hpull', 'bodyweight'],
  ['Front_Squat_Clean_Grip', 'lift', 'squat', 'gym'],
  ['Straight-Arm_Dumbbell_Pullover', 'lift', 'vpull', 'dumbbell'],
  ['Push_Press', 'lift', 'vpush', 'gym'],
];

const out = [];
for (const [id, kind, pattern, equip] of curated) {
  const e = byId.get(id);
  if (!e) {
    console.error('MISSING', id);
    continue;
  }
  if (!e.images || e.images.length < 2) console.error('NO 2 FRAMES', id);
  out.push({
    id,
    name: e.name,
    kind,
    pattern,
    equip,
    level: e.level,
    muscles: e.primaryMuscles,
    instructions: e.instructions,
    frames: e.images, // relative to exercises/ in the db repo
  });
}

// Custom drills that the database does not have. They borrow demo photos from a similar move.
const custom = [
  {
    id: 'X_Weighted_Pullup', name: 'Weighted Pull-Up', kind: 'lift', pattern: 'vpull', equip: 'dumbbell',
    borrow: 'Pullups',
    instructions: [
      'Hold a dumbbell between your feet (or wear a loaded backpack).',
      'Start from a dead hang, shoulders pulled down.',
      'Pull until your chin clears the bar, then lower under control for 2 seconds.',
    ],
  },
  {
    id: 'X_Explosive_Pullup', name: 'Explosive Pull-Up (to chest)', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    borrow: 'Gironda_Sternum_Chins',
    instructions: [
      'Start from a dead hang with an overhand grip, slightly wider than shoulders.',
      'Pull as fast as you can and aim to touch the bar to your lower chest / sternum, leaning back slightly.',
      'Lower under control. Stop the set when the bar stops reaching your chest.',
    ],
  },
  {
    id: 'X_False_Grip_Hang', name: 'False-Grip Hang', kind: 'core', pattern: 'skill', equip: 'bodyweight',
    borrow: 'Muscle_Up',
    instructions: [
      'Put the bar in the crease of your wrist, wrist rolled over the top of the bar, thumbs wrapped.',
      'Hang with shoulders active (not shrugged to the ears). Stop if elbows or wrists complain.',
    ],
  },
  {
    id: 'X_Straight_Bar_Dip', name: 'Straight-Bar Dip', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    borrow: 'Dips_-_Chest_Version',
    instructions: [
      'Check the bar is firmly anchored and rated for your body weight before you start.',
      'Jump up to support over the bar, hands on the bar, chest leaning slightly forward, elbows tucked.',
      'Lower slowly until the bar is at your lower chest and your shoulders are still active, then press back to full lockout.',
      'This is the top half of a muscle-up. Stop the set when you lose control or your elbows flare.',
    ],
  },
  {
    id: 'X_MU_Transition', name: 'Muscle-Up Transition Drill', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    borrow: 'Muscle_Up',
    instructions: [
      'From a pull-up with chest at the bar, practice rolling the chest over the bar by pushing the elbows back and up.',
      'Use a jump from the floor or a bench to get to chest height, then slow-lower back down (negative).',
      'Quality over reps. Stop before form breaks down.',
    ],
  },
];
for (const c of custom) {
  const b = byId.get(c.borrow);
  out.push({
    id: c.id, name: c.name, kind: c.kind, pattern: c.pattern, equip: c.equip, level: 'intermediate',
    muscles: b ? b.primaryMuscles : [], instructions: c.instructions, frames: b ? b.images : [],
    custom: true,
  });
}
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/exercises.json', JSON.stringify(out));
console.log('wrote', out.length, 'exercises');
