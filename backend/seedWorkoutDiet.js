const mongoose = require('mongoose');
const WorkoutPlan = require('./models/workoutPlanModel');
const DietPlan = require('./models/dietPlanModel');

const seedWorkoutPlans = async () => {
    try {
        // Clear existing workout plans
        await WorkoutPlan.deleteMany({});

        // MUSCLE BUILDING - Push/Pull/Legs Split (Week 1)
        const muscleBuildingPlans = [
            // Day 1: Push (Chest/Shoulders/Triceps)
            {
                programType: 'muscle_building',
                weekNumber: 1,
                dayNumber: 1,
                dayType: 'push',
                dayName: 'Push Day - Chest, Shoulders, Triceps',
                totalDuration: 75,
                difficulty: 'intermediate',
                caloriesBurned: 350,
                description: 'Focus on compound pushing movements with progressive overload',
                exercises: [
                    {
                        name: 'Barbell Bench Press',
                        sets: 4,
                        reps: '8-10',
                        restSeconds: 120,
                        notes: 'Control the eccentric, explosive concentric. Touch chest lightly.',
                        muscleGroup: 'chest',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Incline Dumbbell Press',
                        sets: 4,
                        reps: '10-12',
                        restSeconds: 90,
                        notes: '30-45 degree incline. Full range of motion.',
                        muscleGroup: 'chest',
                        equipment: 'Dumbbells'
                    },
                    {
                        name: 'Standing Overhead Press',
                        sets: 4,
                        reps: '8-10',
                        restSeconds: 120,
                        notes: 'Strict form, core tight. Press in front of face.',
                        muscleGroup: 'shoulders',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Lateral Raises',
                        sets: 3,
                        reps: '12-15',
                        restSeconds: 60,
                        notes: 'Slight bend in elbows, lead with elbows not hands.',
                        muscleGroup: 'shoulders',
                        equipment: 'Dumbbells'
                    },
                    {
                        name: 'Weighted Dips',
                        sets: 3,
                        reps: '10-12',
                        restSeconds: 90,
                        notes: 'Lean forward for chest emphasis. Full ROM.',
                        muscleGroup: 'chest',
                        equipment: 'Dip Bar'
                    },
                    {
                        name: 'Cable Tricep Pushdowns',
                        sets: 3,
                        reps: '12-15',
                        restSeconds: 60,
                        notes: 'Keep elbows tucked. Squeeze at bottom.',
                        muscleGroup: 'arms',
                        equipment: 'Cable Machine'
                    }
                ]
            },

            // Day 2: Pull (Back/Biceps)
            {
                programType: 'muscle_building',
                weekNumber: 1,
                dayNumber: 2,
                dayType: 'pull',
                dayName: 'Pull Day - Back, Biceps, Rear Delts',
                totalDuration: 75,
                difficulty: 'intermediate',
                caloriesBurned: 340,
                description: 'Build a thick, wide back with compound pulling movements',
                exercises: [
                    {
                        name: 'Conventional Deadlifts',
                        sets: 4,
                        reps: '6-8',
                        restSeconds: 180,
                        notes: 'Hip hinge pattern. Neutral spine. Drive through heels.',
                        muscleGroup: 'back',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Pull-ups (Weighted if possible)',
                        sets: 4,
                        reps: '8-12',
                        restSeconds: 120,
                        notes: 'Full hang to chin over bar. Control the descent.',
                        muscleGroup: 'back',
                        equipment: 'Pull-up Bar'
                    },
                    {
                        name: 'Barbell Rows',
                        sets: 4,
                        reps: '8-10',
                        restSeconds: 90,
                        notes: 'Pull to lower chest. Squeeze shoulder blades.',
                        muscleGroup: 'back',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Face Pulls',
                        sets: 3,
                        reps: '15-20',
                        restSeconds: 60,
                        notes: 'Pull to face level. External rotation at end.',
                        muscleGroup: 'shoulders',
                        equipment: 'Cable Machine'
                    },
                    {
                        name: 'Barbell Curls',
                        sets: 3,
                        reps: '10-12',
                        restSeconds: 75,
                        notes: 'No swinging. Full supination at top.',
                        muscleGroup: 'arms',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Hammer Curls',
                        sets: 3,
                        reps: '12-15',
                        restSeconds: 60,
                        notes: 'Neutral grip throughout. Control the negative.',
                        muscleGroup: 'arms',
                        equipment: 'Dumbbells'
                    }
                ]
            },

            // Day 3: Legs (Quads/Hamstrings/Glutes/Calves)
            {
                programType: 'muscle_building',
                weekNumber: 1,
                dayNumber: 3,
                dayType: 'legs',
                dayName: 'Leg Day - Quads, Hamstrings, Glutes, Calves',
                totalDuration: 80,
                difficulty: 'intermediate',
                caloriesBurned: 400,
                description: 'Complete lower body development with compound movements',
                exercises: [
                    {
                        name: 'Back Squats',
                        sets: 4,
                        reps: '8-10',
                        restSeconds: 180,
                        notes: 'Depth to parallel or below. Drive through heels.',
                        muscleGroup: 'legs',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Romanian Deadlifts',
                        sets: 4,
                        reps: '10-12',
                        restSeconds: 120,
                        notes: 'Feel the stretch in hamstrings. Slight knee bend.',
                        muscleGroup: 'legs',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Leg Press',
                        sets: 3,
                        reps: '12-15',
                        restSeconds: 90,
                        notes: 'Feet shoulder-width. Full ROM without lower back rounding.',
                        muscleGroup: 'legs',
                        equipment: 'Leg Press Machine'
                    },
                    {
                        name: 'Walking Lunges',
                        sets: 3,
                        reps: '12 per leg',
                        restSeconds: 90,
                        notes: 'Long stride. Knee doesn\'t pass toes.',
                        muscleGroup: 'legs',
                        equipment: 'Dumbbells'
                    },
                    {
                        name: 'Leg Curls',
                        sets: 3,
                        reps: '12-15',
                        restSeconds: 60,
                        notes: 'Squeeze at top. Slow eccentric.',
                        muscleGroup: 'legs',
                        equipment: 'Leg Curl Machine'
                    },
                    {
                        name: 'Standing Calf Raises',
                        sets: 4,
                        reps: '15-20',
                        restSeconds: 60,
                        notes: 'Full stretch at bottom. Pause at top.',
                        muscleGroup: 'legs',
                        equipment: 'Calf Raise Machine'
                    }
                ]
            },

            // Day 4: Push (Repeat with slight variations)
            {
                programType: 'muscle_building',
                weekNumber: 1,
                dayNumber: 4,
                dayType: 'push',
                dayName: 'Push Day - Chest, Shoulders, Triceps (Variation)',
                totalDuration: 75,
                difficulty: 'intermediate',
                caloriesBurned: 350,
                description: 'Second push day with exercise variations for complete development',
                exercises: [
                    {
                        name: 'Incline Barbell Press',
                        sets: 4,
                        reps: '8-10',
                        restSeconds: 120,
                        notes: 'Upper chest focus. 30-45 degree angle.',
                        muscleGroup: 'chest',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Flat Dumbbell Press',
                        sets: 4,
                        reps: '10-12',
                        restSeconds: 90,
                        notes: 'Deeper stretch than barbell. Neutral wrist.',
                        muscleGroup: 'chest',
                        equipment: 'Dumbbells'
                    },
                    {
                        name: 'Seated Dumbbell Shoulder Press',
                        sets: 4,
                        reps: '10-12',
                        restSeconds: 90,
                        notes: 'Press straight up. Don\'t arch back excessively.',
                        muscleGroup: 'shoulders',
                        equipment: 'Dumbbells'
                    },
                    {
                        name: 'Cable Lateral Raises',
                        sets: 3,
                        reps: '15-20',
                        restSeconds: 60,
                        notes: 'Constant tension. Control the movement.',
                        muscleGroup: 'shoulders',
                        equipment: 'Cable Machine'
                    },
                    {
                        name: 'Close-Grip Bench Press',
                        sets: 3,
                        reps: '10-12',
                        restSeconds: 90,
                        notes: 'Hands shoulder-width. Elbows tucked.',
                        muscleGroup: 'arms',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Overhead Tricep Extension',
                        sets: 3,
                        reps: '12-15',
                        restSeconds: 60,
                        notes: 'Keep elbows stationary. Full stretch.',
                        muscleGroup: 'arms',
                        equipment: 'Dumbbell'
                    }
                ]
            },

            // Day 5: Pull (Variation)
            {
                programType: 'muscle_building',
                weekNumber: 1,
                dayNumber: 5,
                dayType: 'pull',
                dayName: 'Pull Day - Back, Biceps (Variation)',
                totalDuration: 75,
                difficulty: 'intermediate',
                caloriesBurned: 340,
                description: 'Second pull day focusing on width and thickness',
                exercises: [
                    {
                        name: 'Lat Pulldowns (Wide Grip)',
                        sets: 4,
                        reps: '10-12',
                        restSeconds: 90,
                        notes: 'Pull to upper chest. Lean back slightly.',
                        muscleGroup: 'back',
                        equipment: 'Cable Machine'
                    },
                    {
                        name: 'T-Bar Rows',
                        sets: 4,
                        reps: '10-12',
                        restSeconds: 90,
                        notes: 'Pull to lower chest. Keep back flat.',
                        muscleGroup: 'back',
                        equipment: 'T-Bar Row'
                    },
                    {
                        name: 'Seated Cable Rows',
                        sets: 4,
                        reps: '12-15',
                        restSeconds: 75,
                        notes: 'Squeeze shoulder blades. Chest up.',
                        muscleGroup: 'back',
                        equipment: 'Cable Machine'
                    },
                    {
                        name: 'Reverse Pec Deck',
                        sets: 3,
                        reps: '15-20',
                        restSeconds: 60,
                        notes: 'Rear delt isolation. Squeeze at back.',
                        muscleGroup: 'shoulders',
                        equipment: 'Pec Deck Machine'
                    },
                    {
                        name: 'Incline Dumbbell Curls',
                        sets: 3,
                        reps: '12-15',
                        restSeconds: 75,
                        notes: 'Full stretch at bottom. No momentum.',
                        muscleGroup: 'arms',
                        equipment: 'Dumbbells'
                    },
                    {
                        name: 'Cable Curls',
                        sets: 3,
                        reps: '15-20',
                        restSeconds: 60,
                        notes: 'Constant tension. Pump work.',
                        muscleGroup: 'arms',
                        equipment: 'Cable Machine'
                    }
                ]
            },

            // Day 6: Legs (Variation)
            {
                programType: 'muscle_building',
                weekNumber: 1,
                dayNumber: 6,
                dayType: 'legs',
                dayName: 'Leg Day - Quads, Hamstrings (Variation)',
                totalDuration: 80,
                difficulty: 'intermediate',
                caloriesBurned: 400,
                description: 'Second leg day with different exercises for complete development',
                exercises: [
                    {
                        name: 'Front Squats',
                        sets: 4,
                        reps: '10-12',
                        restSeconds: 150,
                        notes: 'Quad focus. Upright torso. Elbows high.',
                        muscleGroup: 'legs',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Bulgarian Split Squats',
                        sets: 3,
                        reps: '12 per leg',
                        restSeconds: 90,
                        notes: 'Back foot elevated. Front knee tracks over toes.',
                        muscleGroup: 'legs',
                        equipment: 'Dumbbells'
                    },
                    {
                        name: 'Leg Extensions',
                        sets: 3,
                        reps: '15-20',
                        restSeconds: 60,
                        notes: 'Quad isolation. Squeeze at top.',
                        muscleGroup: 'legs',
                        equipment: 'Leg Extension Machine'
                    },
                    {
                        name: 'Stiff-Leg Deadlifts',
                        sets: 4,
                        reps: '12-15',
                        restSeconds: 90,
                        notes: 'Hamstring focus. Slight knee bend.',
                        muscleGroup: 'legs',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Glute Bridges',
                        sets: 3,
                        reps: '15-20',
                        restSeconds: 60,
                        notes: 'Squeeze glutes at top. Pause.',
                        muscleGroup: 'legs',
                        equipment: 'Barbell'
                    },
                    {
                        name: 'Seated Calf Raises',
                        sets: 4,
                        reps: '20-25',
                        restSeconds: 45,
                        notes: 'Soleus focus. High reps.',
                        muscleGroup: 'legs',
                        equipment: 'Calf Raise Machine'
                    }
                ]
            },

            // Day 7: Rest
            {
                programType: 'muscle_building',
                weekNumber: 1,
                dayNumber: 7,
                dayType: 'rest',
                dayName: 'Rest Day - Active Recovery',
                totalDuration: 30,
                difficulty: 'beginner',
                caloriesBurned: 100,
                description: 'Light activity for recovery - walking, stretching, yoga',
                exercises: [
                    {
                        name: 'Light Walking',
                        sets: 1,
                        reps: '20-30 min',
                        restSeconds: 0,
                        notes: 'Low intensity. Promote blood flow.',
                        muscleGroup: 'cardio',
                        equipment: 'None'
                    },
                    {
                        name: 'Full Body Stretching',
                        sets: 1,
                        reps: '15-20 min',
                        restSeconds: 0,
                        notes: 'Hold each stretch 30-60 seconds.',
                        muscleGroup: 'core',
                        equipment: 'None'
                    }
                ]
            }
        ];

        // FAT LOSS - HIIT Circuits (Week 1)
        const fatLossPlans = [
            // Day 1: HIIT Circuit 1
            {
                programType: 'fat_loss',
                weekNumber: 1,
                dayNumber: 1,
                dayType: 'hiit',
                dayName: 'HIIT Circuit - Full Body Burn',
                totalDuration: 45,
                difficulty: 'intermediate',
                caloriesBurned: 450,
                description: 'High-intensity metabolic circuit for maximum fat burn',
                exercises: [
                    {
                        name: 'Burpees',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 30,
                        notes: 'Full body movement. Explosive jump.',
                        muscleGroup: 'cardio',
                        equipment: 'None'
                    },
                    {
                        name: 'Mountain Climbers',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 30,
                        notes: 'Fast pace. Core tight.',
                        muscleGroup: 'core',
                        equipment: 'None'
                    },
                    {
                        name: 'Jump Squats',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 30,
                        notes: 'Explosive power. Land softly.',
                        muscleGroup: 'legs',
                        equipment: 'None'
                    },
                    {
                        name: 'Push-up to T',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 30,
                        notes: 'Rotate to side plank after each push-up.',
                        muscleGroup: 'chest',
                        equipment: 'None'
                    },
                    {
                        name: 'High Knees',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 30,
                        notes: 'Drive knees to chest. Fast pace.',
                        muscleGroup: 'cardio',
                        equipment: 'None'
                    },
                    {
                        name: 'Plank Jacks',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 60,
                        notes: 'Jump feet in and out. Core engaged.',
                        muscleGroup: 'core',
                        equipment: 'None'
                    }
                ]
            },

            // Day 2: HIIT Circuit 2
            {
                programType: 'fat_loss',
                weekNumber: 1,
                dayNumber: 2,
                dayType: 'hiit',
                dayName: 'HIIT Circuit - Lower Body Focus',
                totalDuration: 45,
                difficulty: 'intermediate',
                caloriesBurned: 420,
                description: 'Lower body dominant HIIT for leg development and fat loss',
                exercises: [
                    {
                        name: 'Jump Lunges',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 30,
                        notes: 'Alternate legs in air. Explosive.',
                        muscleGroup: 'legs',
                        equipment: 'None'
                    },
                    {
                        name: 'Box Jumps',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 30,
                        notes: 'Jump onto elevated surface. Step down.',
                        muscleGroup: 'legs',
                        equipment: 'Box/Bench'
                    },
                    {
                        name: 'Squat Thrusts',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 30,
                        notes: 'Squat, hands down, jump back, jump in.',
                        muscleGroup: 'legs',
                        equipment: 'None'
                    },
                    {
                        name: 'Skater Hops',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 30,
                        notes: 'Lateral jumps. Land on one foot.',
                        muscleGroup: 'legs',
                        equipment: 'None'
                    },
                    {
                        name: 'Wall Sit',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 30,
                        notes: 'Isometric hold. Thighs parallel to ground.',
                        muscleGroup: 'legs',
                        equipment: 'None'
                    },
                    {
                        name: 'Bicycle Crunches',
                        sets: 5,
                        reps: '30 seconds',
                        restSeconds: 60,
                        notes: 'Opposite elbow to knee. Controlled.',
                        muscleGroup: 'core',
                        equipment: 'None'
                    }
                ]
            },

            // Continue pattern for remaining days...
            // Day 3-7 similar structure with different exercises
        ];

        // STRENGTH TRAINING - Similar to Muscle Building but lower reps (3-6)
        const strengthPlans = muscleBuildingPlans.map(plan => ({
            ...plan,
            programType: 'strength',
            exercises: plan.exercises.map(ex => ({
                ...ex,
                reps: ex.reps.includes('30 seconds') ? ex.reps : '3-6', // Lower reps for strength
                restSeconds: ex.restSeconds + 30 // More rest for strength
            }))
        }));

        // Insert all plans
        await WorkoutPlan.insertMany([...muscleBuildingPlans, ...fatLossPlans, ...strengthPlans]);

        console.log('✅ Workout plans seeded successfully!');
    } catch (error) {
        console.error('Error seeding workout plans:', error);
    }
};

const seedDietPlans = async () => {
    try {
        // Clear existing diet plans
        await DietPlan.deleteMany({});

        // MUSCLE BUILDING DIET (3000-3500 calories)
        const muscleBuildingDiet = {
            programType: 'muscle_building',
            weekNumber: 1,
            calorieTarget: 3100,
            macroTargets: {
                protein: 245,
                carbs: 260,
                fats: 115
            },
            waterIntake: 4,
            meals: [
                {
                    time: '07:00',
                    name: 'Breakfast',
                    foods: ['4 whole eggs', '2 egg whites', '100g oatmeal', '1 banana', '1 tbsp peanut butter'],
                    macros: { protein: 45, carbs: 80, fats: 25 },
                    calories: 670,
                    notes: 'Start your day with quality protein and complex carbs',
                    alternatives: ['Greek yogurt with granola', 'Protein pancakes']
                },
                {
                    time: '10:00',
                    name: 'Mid-Morning Snack',
                    foods: ['Whey protein shake (30g)', '50g almonds', '1 apple'],
                    macros: { protein: 35, carbs: 35, fats: 25 },
                    calories: 485,
                    notes: 'Keep metabolism active',
                    alternatives: ['Cottage cheese with nuts', 'Protein bar']
                },
                {
                    time: '13:00',
                    name: 'Lunch',
                    foods: ['200g chicken breast', '150g brown rice', 'Mixed vegetables', '1 tbsp olive oil'],
                    macros: { protein: 50, carbs: 60, fats: 15 },
                    calories: 565,
                    notes: 'Main meal of the day - high protein and carbs',
                    alternatives: ['Turkey breast', 'Lean beef', 'Fish']
                },
                {
                    time: '16:00',
                    name: 'Pre-Workout',
                    foods: ['150g sweet potato', '150g lean beef', 'Spinach salad'],
                    macros: { protein: 40, carbs: 45, fats: 15 },
                    calories: 465,
                    notes: 'Fuel for your workout - 1-2 hours before training',
                    alternatives: ['Rice with chicken', 'Pasta with turkey']
                },
                {
                    time: '19:00',
                    name: 'Post-Workout Dinner',
                    foods: ['200g salmon', '100g quinoa', 'Broccoli', 'Avocado (half)'],
                    macros: { protein: 45, carbs: 40, fats: 25 },
                    calories: 545,
                    notes: 'Recovery meal - protein and healthy fats',
                    alternatives: ['Tilapia', 'Tuna', 'Chicken thighs']
                },
                {
                    time: '22:00',
                    name: 'Before Bed',
                    foods: ['200g Greek yogurt', '30g peanut butter', 'Casein protein (optional)'],
                    macros: { protein: 35, carbs: 20, fats: 20 },
                    calories: 380,
                    notes: 'Slow-digesting protein for overnight recovery',
                    alternatives: ['Cottage cheese', 'Protein shake']
                }
            ],
            supplements: [
                { name: 'Whey Protein', timing: 'Post-workout', dosage: '30g' },
                { name: 'Creatine Monohydrate', timing: 'Daily', dosage: '5g' },
                { name: 'Multivitamin', timing: 'Morning', dosage: '1 tablet' }
            ],
            notes: 'Adjust portions based on your weight and progress. Aim for 1g protein per lb bodyweight.'
        };

        // FAT LOSS DIET (1800-2200 calories)
        const fatLossDiet = {
            programType: 'fat_loss',
            weekNumber: 1,
            calorieTarget: 2000,
            macroTargets: {
                protein: 180,
                carbs: 150,
                fats: 70
            },
            waterIntake: 4,
            meals: [
                {
                    time: '12:00',
                    name: 'Lunch (First Meal - IF)',
                    foods: ['200g chicken breast', '100g brown rice', 'Large salad', 'Balsamic vinegar'],
                    macros: { protein: 50, carbs: 40, fats: 10 },
                    calories: 430,
                    notes: 'Breaking fast - high protein, moderate carbs',
                    alternatives: ['Turkey', 'Fish', 'Lean beef']
                },
                {
                    time: '15:00',
                    name: 'Afternoon Snack',
                    foods: ['Protein shake (25g)', '1 apple', '15g almonds'],
                    macros: { protein: 30, carbs: 25, fats: 12 },
                    calories: 310,
                    notes: 'Keep energy levels stable',
                    alternatives: ['Greek yogurt', 'Protein bar']
                },
                {
                    time: '18:00',
                    name: 'Pre-Workout',
                    foods: ['100g sweet potato', '150g tilapia', 'Green beans'],
                    macros: { protein: 35, carbs: 30, fats: 8 },
                    calories: 320,
                    notes: 'Light meal before training',
                    alternatives: ['Rice cakes with tuna', 'Oatmeal with protein']
                },
                {
                    time: '20:00',
                    name: 'Post-Workout Dinner',
                    foods: ['200g salmon', 'Asparagus', 'Cauliflower rice', 'Olive oil (1 tbsp)'],
                    macros: { protein: 45, carbs: 15, fats: 25 },
                    calories: 465,
                    notes: 'High protein, low carb for fat loss',
                    alternatives: ['Chicken', 'Turkey', 'Lean steak']
                },
                {
                    time: '22:00',
                    name: 'Evening Snack',
                    foods: ['150g Greek yogurt', 'Berries', 'Cinnamon'],
                    macros: { protein: 20, carbs: 20, fats: 5 },
                    calories: 195,
                    notes: 'Light, satisfying before bed',
                    alternatives: ['Casein shake', 'Cottage cheese']
                }
            ],
            supplements: [
                { name: 'Whey Protein', timing: 'Post-workout', dosage: '25g' },
                { name: 'BCAAs', timing: 'During workout', dosage: '5g' },
                { name: 'Green Tea Extract', timing: 'Morning', dosage: '500mg' }
            ],
            notes: 'Intermittent fasting 16:8. Eating window: 12pm-8pm. Stay hydrated!'
        };

        // STRENGTH TRAINING DIET (Similar to muscle building, slightly higher calories)
        const strengthDiet = {
            ...muscleBuildingDiet,
            programType: 'strength',
            calorieTarget: 3300,
            notes: 'Higher calories to support heavy lifting and recovery. Focus on nutrient timing around workouts.'
        };

        // Insert all diet plans
        await DietPlan.insertMany([muscleBuildingDiet, fatLossDiet, strengthDiet]);

        console.log('✅ Diet plans seeded successfully!');
    } catch (error) {
        console.error('Error seeding diet plans:', error);
    }
};

const seedAll = async () => {
    try {
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitwithram';
        await mongoose.connect(dbUri);
        console.log('Connected to MongoDB for seeding...');

        await seedWorkoutPlans();
        await seedDietPlans();

        console.log('Done seeding everything!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    seedAll();
}

module.exports = { seedWorkoutPlans, seedDietPlans };
