import * as THREE from 'three';
import { eventBus as bus } from '../lib/eventBus';

export class CheckpointSystem {
  route: THREE.Vector3[] = [
    new THREE.Vector3(0, 10, 0), // Start
    new THREE.Vector3(50, 20, 50),
    new THREE.Vector3(100, 10, 0),
    new THREE.Vector3(0, 10, -100), // Finish
  ];
  currentIndex = 0;
  timerStart = 0;
  isRacing = false;
  checkRadius = 5;
  routeId = 'default-route';

  startRace() {
    this.currentIndex = 0;
    this.timerStart = performance.now();
    this.isRacing = true;
    bus.emit('race:checkpoint', { index: 0, routeId: this.routeId }); // Start
  }

  update(playerPos: THREE.Vector3) {
    if (!this.isRacing || this.currentIndex >= this.route.length - 1) return;

    const target = this.route[this.currentIndex];
    const dist = playerPos.distanceTo(target);
    if (dist < this.checkRadius) {
      this.currentIndex++;
      bus.emit('race:checkpoint', { index: this.currentIndex, routeId: this.routeId });

      if (this.currentIndex >= this.route.length - 1) {
        this.finish();
      }
    }
  }

  private finish() {
    const timeMs = performance.now() - this.timerStart;
    this.isRacing = false;
    bus.emit('race:checkpoint', { index: -1, routeId: this.routeId }); // Finish signal
    // Update XP stub: + timeMs / 10 or fixed
    // useProfileStore.getState().updateProfile({ xp: timeMs / 10 });
    console.log(`Race finished in ${timeMs}ms`);
  }
}
