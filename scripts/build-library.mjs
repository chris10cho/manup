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
  // calisthenics (doorframe bar + floor)
  ['Mixed_Grip_Chin', 'bodyweight', 'vpull', 'bodyweight'],
  ['Side_To_Side_Chins', 'bodyweight', 'vpull', 'bodyweight'],
  ['Scapular_Pull-Up', 'bodyweight', 'vpull', 'bodyweight'],
  ['Hanging_Pike', 'core', 'core', 'bodyweight'],
  ['Handstand_Push-Ups', 'bodyweight', 'vpush', 'bodyweight'],
  ['Push-Up_Wide', 'bodyweight', 'hpush', 'bodyweight'],
  ['Push-Ups_-_Close_Triceps_Position', 'bodyweight', 'hpush', 'bodyweight'],
  ['Decline_Push-Up', 'bodyweight', 'hpush', 'bodyweight'],
  ['Clock_Push-Up', 'bodyweight', 'hpush', 'bodyweight'],
  ['Plyo_Push-up', 'bodyweight', 'hpush', 'bodyweight'],
  ['Crossover_Reverse_Lunge', 'bodyweight', 'lunge', 'bodyweight'],
  ['Freehand_Jump_Squat', 'bodyweight', 'squat', 'bodyweight'],
  ['Reverse_Crunch', 'core', 'core', 'bodyweight'],
  ['Dead_Bug', 'core', 'core', 'bodyweight'],
  ['Jackknife_Sit-Up', 'core', 'core', 'bodyweight'],
  ['Scissor_Kick', 'core', 'core', 'bodyweight'],
  ['Side_Bridge', 'core', 'core', 'bodyweight'],
  ['The_Straddle', 'mobility', 'stretch', 'none'],
  ['Seated_Floor_Hamstring_Stretch', 'mobility', 'stretch', 'none'],
  ['Kneeling_Forearm_Stretch', 'mobility', 'stretch', 'none'],
  ['Upper_Back_Stretch', 'mobility', 'stretch', 'none'],
  // mobility / flexibility
  ['Wrist_Circles', 'mobility', 'stretch', 'none'],
  ['Shoulder_Circles', 'mobility', 'stretch', 'none'],
  ['Triceps_Stretch', 'mobility', 'stretch', 'none'],
  ['Kneeling_Hip_Flexor', 'mobility', 'stretch', 'none'],
  ['IT_Band_and_Glute_Stretch', 'mobility', 'stretch', 'none'],
  ['Standing_Hamstring_and_Calf_Stretch', 'mobility', 'stretch', 'none'],
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

  // ---- calisthenics: pull variations
  { id: 'X_Wide_Pullup', name: 'Wide-Grip Pull-Up', kind: 'bodyweight', pattern: 'vpull', equip: 'bodyweight', borrow: 'Pullups',
    instructions: ['Overhand grip about 1.5x shoulder width.', 'Pull your chest toward the bar, elbows driving down and out.', 'Full hang at the bottom, shoulders active, no swinging.'] },
  { id: 'X_Neutral_Pullup', name: 'Neutral-Grip Pull-Up', kind: 'bodyweight', pattern: 'vpull', equip: 'bodyweight', borrow: 'V-Bar_Pullup',
    instructions: ['Use the parallel handles on your doorframe bar, palms facing each other.', 'Pull until your chin clears the handles, elbows close to your sides.', 'Lower under control to a full hang.'] },
  { id: 'X_LSit_Pullup', name: 'L-Sit Pull-Up', kind: 'bodyweight', pattern: 'vpull', equip: 'bodyweight', borrow: 'Pullups',
    instructions: ['Hang and lift your straight legs to hip height (bend the knees if the doorframe is in the way).', 'Keep the legs up while you pull your chin over the bar.', 'Lower slowly; stop the set when the legs drop.'] },
  { id: 'X_Slow_Negative_Pullup', name: 'Slow Negative Pull-Up (5 s)', kind: 'bodyweight', pattern: 'vpull', equip: 'bodyweight', borrow: 'Pullups',
    instructions: ['Get your chin over the bar (pull up or step up).', 'Lower for a slow count of 5 to a full hang.', 'Reset and repeat. Every rep is one slow lowering.'] },
  // ---- front lever ladder (doorframe bar; check it is screw-mounted)
  { id: 'X_FL_Tuck', name: 'Tuck Front Lever Hold', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['Overhand grip, arms straight. Pull the knees to the chest and lean back until your back is flat and level with the floor.', 'Push the bar down toward your hips with straight arms; squeeze shoulder blades down.', 'Hold with a flat back. The set ends when your hips sag below the bar line.'] },
  { id: 'X_FL_AdvTuck', name: 'Advanced Tuck Front Lever Hold', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['Same as the tuck lever, but open the hips so the thighs are about 90 degrees to the torso and the back stays flat.', 'Arms straight, push the bar toward your hips.', 'End the set when the back rounds or the hips drop.'] },
  { id: 'X_FL_OneLeg', name: 'One-Leg Front Lever Hold', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['From advanced tuck, extend one leg straight while the other stays tucked. Switch legs each set.', 'Body level with the floor, arms straight.'] },
  { id: 'X_FL_Straddle', name: 'Straddle Front Lever Hold', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['Both legs straight and spread wide, body level with the floor.', 'Arms straight, glutes squeezed, toes pointed.'] },
  { id: 'X_FL_Tuck_Row', name: 'Tuck Front Lever Row', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['From a tuck front lever, pull the bar to your lower chest while keeping the body level.', 'Lower back to straight arms with control. Body stays horizontal the whole time.'] },
  { id: 'X_FL_AdvTuck_Row', name: 'Advanced Tuck Front Lever Row', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['Same as the tuck row, from an advanced tuck (flat back, hips open).', 'Pull to the lower chest, lower with control.'] },
  { id: 'X_Hanging_Knee_Raise', name: 'Hanging Knee Raise', kind: 'core', pattern: 'core', equip: 'bodyweight', borrow: 'Hanging_Leg_Raise',
    instructions: ['Hang with active shoulders.', 'Curl the knees up to the chest, rolling the pelvis up.', 'Lower slowly without swinging.'] },
  // ---- handstand / HSPU ladder (wall)
  { id: 'X_HS_Wall_Hold', name: 'Chest-to-Wall Handstand Hold', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['Walk your feet up the wall until your chest faces the wall, hands 10 to 20 cm from it.', 'Push tall through the shoulders, ribs in, glutes and legs squeezed, toes pointed.', 'Come down by walking the feet back down.'] },
  { id: 'X_HS_Kickup', name: 'Freestanding Handstand Kick-Up Practice', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['Kick up away from the wall in open space. Learn to bail first: turn one hand out and cartwheel down.', 'Count only the seconds you balance without the wall; log your best hold per set.'] },
  { id: 'X_HS_Free', name: 'Freestanding Handstand Hold', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['Kick up to a freestanding handstand, stack hips over shoulders.', 'Balance with finger and palm pressure. Log the held seconds.'] },
  { id: 'X_Pike_Pushup_Elevated', name: 'Elevated Pike Push-Up', kind: 'bodyweight', pattern: 'vpush', equip: 'bodyweight', borrow: 'Push-Ups_With_Feet_Elevated',
    instructions: ['Feet on a chair, hips high so the body makes an upside-down L.', 'Lower the top of your head toward the floor in front of your hands, elbows at about 45 degrees.', 'Press back up to straight arms.'] },
  { id: 'X_HSPU_Negative', name: 'Wall Handstand Push-Up Negative', kind: 'bodyweight', pattern: 'vpush', equip: 'bodyweight', borrow: 'Handstand_Push-Ups',
    instructions: ['Kick up to a back-to-wall handstand (put a folded towel under your head).', 'Lower for a slow 3 to 5 seconds until your head touches the towel.', 'Come down, reset, repeat. Do not press up yet.'] },
  { id: 'X_HSPU_Deficit', name: 'Deficit Wall Handstand Push-Up', kind: 'bodyweight', pattern: 'vpush', equip: 'bodyweight', borrow: 'Handstand_Push-Ups',
    instructions: ['Hands on two stable raised surfaces (books or blocks) so your head can go below hand level.', 'Lower until the shoulders reach the hands, press back to straight arms.'] },
  // ---- planche ladder (floor)
  { id: 'X_Planche_Lean', name: 'Planche Lean', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['Push-up position, fingers turned out to the sides.', 'Lean the shoulders forward past the hands with straight arms, shoulder blades pushed apart (protracted).', 'Hold the lean; go further forward as it gets easier.'] },
  { id: 'X_Frog_Stand', name: 'Frog Stand (Crow)', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['Squat, hands flat on the floor, knees resting on the backs of the upper arms.', 'Lean forward until the feet lift off the floor. Balance with fingers.'] },
  { id: 'X_Tuck_Planche', name: 'Tuck Planche Hold', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['Hands on the floor (or fists/parallettes if wrists complain), arms straight.', 'Lean forward and lift the tucked knees off the floor, hips up level with shoulders.', 'Push the floor away, round the upper back slightly.'] },
  { id: 'X_Adv_Tuck_Planche', name: 'Advanced Tuck Planche Hold', kind: 'bodyweight', pattern: 'skill', equip: 'bodyweight',
    instructions: ['Like the tuck planche, but the back is flat and the hips open so the knees move away from the chest.', 'Arms straight, shoulders well in front of the hands.'] },
  { id: 'X_PPPU', name: 'Pseudo Planche Push-Up', kind: 'bodyweight', pattern: 'hpush', equip: 'bodyweight', borrow: 'Pushups',
    instructions: ['Push-up position with hands by your waist, fingers turned out.', 'Lean the shoulders forward past the hands and keep that lean through every rep.', 'Lower the chest, press back up, keep protracting at the top.'] },
  { id: 'X_Archer_Pushup', name: 'Archer Push-Up', kind: 'bodyweight', pattern: 'hpush', equip: 'bodyweight', borrow: 'Pushups_Close_and_Wide_Hand_Positions',
    instructions: ['Very wide hand position. Lower toward one hand while the other arm stays nearly straight.', 'Press back to the middle, then alternate sides. Count each side as one rep.'] },
  // ---- core holds
  { id: 'X_Hollow_Tuck', name: 'Tuck Hollow Body Hold', kind: 'core', pattern: 'core', equip: 'bodyweight',
    instructions: ['Lie on your back, lower back pressed into the floor.', 'Lift shoulders and tucked knees off the floor, arms by your sides.', 'Hold without letting the lower back lift.'] },
  { id: 'X_Hollow_Hold', name: 'Hollow Body Hold', kind: 'core', pattern: 'core', equip: 'bodyweight',
    instructions: ['Lower back glued to the floor, arms overhead, legs straight and low.', 'Shoulders and feet just off the floor. Hold. Raise the legs a bit if the back lifts.'] },
  { id: 'X_Tuck_LSit', name: 'Tuck L-Sit', kind: 'core', pattern: 'core', equip: 'bodyweight',
    instructions: ['Hands on the floor beside the hips (or on two sturdy chairs).', 'Push down with straight arms and lift the hips and tucked knees off the floor.', 'Hold with shoulders pushed down.'] },
  { id: 'X_One_Leg_LSit', name: 'One-Leg L-Sit', kind: 'core', pattern: 'core', equip: 'bodyweight',
    instructions: ['From a tuck L-sit, straighten one leg in front of you. Switch legs each set.'] },
  { id: 'X_LSit', name: 'L-Sit', kind: 'core', pattern: 'core', equip: 'bodyweight',
    instructions: ['Straight arms, both legs straight and level with the floor, toes pointed.', 'Push the floor (or chairs) away and keep the chest up.'] },
  // ---- legs
  { id: 'X_Assisted_Pistol', name: 'Assisted Pistol Squat', kind: 'bodyweight', pattern: 'squat', equip: 'bodyweight', borrow: 'Single-Leg_High_Box_Squat',
    instructions: ['Stand on one leg holding the doorframe for balance, other leg straight in front.', 'Squat down as low as you control, use the arms only as much as needed, stand back up.', 'Per leg.'] },
  { id: 'X_Box_Pistol', name: 'Pistol Squat to Chair', kind: 'bodyweight', pattern: 'squat', equip: 'bodyweight', borrow: 'Single-Leg_High_Box_Squat',
    instructions: ['Stand on one leg in front of a chair, other leg straight out.', 'Sit back slowly to touch the chair without plopping, then stand up on one leg. Per leg.'] },
  { id: 'X_Pistol', name: 'Pistol Squat', kind: 'bodyweight', pattern: 'squat', equip: 'bodyweight', borrow: 'Single-Leg_High_Box_Squat',
    instructions: ['Full single-leg squat to the bottom, other leg straight in front, heel down.', 'Stand up without help. Per leg.'] },
  { id: 'X_Nordic', name: 'Nordic Curl Negative', kind: 'bodyweight', pattern: 'hamstrings', equip: 'bodyweight', borrow: 'Natural_Glute_Ham_Raise',
    instructions: ['Kneel on a cushion with your heels anchored under a couch or bed.', 'Body straight from knees to head, lower forward as slowly as you can, catch yourself with your hands.', 'Push back up with the hands. Each slow lowering is one rep.'] },
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
// Our own drawings: public/demos/<id>-0.svg (and -1.svg for a second frame).
const illustrations = (id) =>
  ['0', '1'].map((n) => `demos/${id}-${n}.svg`).filter((f) => fs.existsSync(`public/${f}`));

for (const c of custom) {
  const drawn = illustrations(c.id);
  if (!c.borrow && drawn.length === 0) console.error('NO PICTURE', c.id);
  const b = c.borrow ? byId.get(c.borrow) : null;
  if (c.borrow && !b) console.error('MISSING BORROW', c.borrow);
  out.push({
    id: c.id, name: c.name, kind: c.kind, pattern: c.pattern, equip: c.equip, level: 'intermediate',
    muscles: b ? b.primaryMuscles : [], instructions: c.instructions,
    frames: drawn.length ? drawn : b ? b.images : [],
    custom: true,
    ...(drawn.length ? { illustrated: true } : {}),
  });
}
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/exercises.json', JSON.stringify(out));
console.log('wrote', out.length, 'exercises');
