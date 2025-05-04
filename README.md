# CS4732Fishing
Authors: Ethan Chen & Jacob Lu

This project is a short animation of a fisherman attempting to catch a fish. The fishermen casts the bait into the water. As a fish swims by and notices the bait, it comes closer, but then goes away, which makes the fishing attempt unsuccessful.

To play the animation, open index.html in a browser window.

Implementation requirements:
- Splines: 
    - A Catmull-Rom spline is used to determine the movement of the fish.
- Quaternions: 
    - SLERPing is used to control the rotation of the fish as it moves through the water.
- Shape Deformation: 
    - We have the fishing rod bend as the line is cast.
- Skeletal Animation: 
    - We implemented a simple bone system for the fishing rod. 
- Hierarchical modeling/kinematics: 
    - We implemented forward kinematics for controlling the skeletal animation of the arm and the fishing rod.
- Physically-based animation: 
    - The bait switches to a physics-based simulation once cast. This simulation is active when the bait is flying through the air, and when the bait is sinking into the water.

One of the challenges we had to face in our project was figuring out a way to sync up all the movements and deformations to create an animation. To do this, we built a custom time-based trigger system that allowed us to activate tweens and functions at specific points in time, and for specific durations as well. In addition, the skinning of the fishing rod and modeling of the rest of the objects took a lot of time to get right since everything was hardcoded.

Task responsibilities:
Ethan:
- creating/animating the fish spline
- animating the bait with a physics system
- creating the time-trigger animation system

Jacob:
- modeling the fisherman arm, fishing rod, and fish.
- skinning the fishing rod and animating the rod bend
- animating the fisherman with forward kinematics
