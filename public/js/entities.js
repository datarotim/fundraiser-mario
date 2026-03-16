import {loadMario} from './entities/Mario.js';
import {loadGoombaBrown, loadGoombaBlue} from './entities/Goomba.js';
import {loadKoopaGreen, loadKoopaBlue} from './entities/Koopa.js';
import {loadCheepSlow, loadCheepFast, loadCheepSlowWavy, loadCheepFastWavy} from './entities/CheepCheep.js';
import {loadPiranhaPlant} from './entities/PiranhaPlant.js';
import {loadBullet} from './entities/Bullet.js';
import {loadCannon} from './entities/Cannon.js';
import {loadBrickShrapnel} from './entities/BrickShrapnel.js';
import {loadPipePortal} from './entities/PipePortal.js';
import {loadFlagPole} from './entities/FlagPole.js';
import {loadLetter} from './entities/Letter.js';
import {loadFireball} from './entities/Fireball.js';
import {loadDataroPowerup} from './entities/DataroPowerup.js';
import {loadDonorBusiness, loadDonorCasual, loadDonorFormal} from './entities/Donor.js';
import {loadSpreadzy, loadBouncer, loadDuper, loadSnippy} from './entities/GeneralEnemy.js';

function createPool(size) {
    const pool = [];

    return function createPooledFactory(factory) {
        for (let i = 0; i < size; i++) {
            pool.push(factory());
        }

        let count = 0;
        return function pooledFactory() {
            const entity = pool[count++ % pool.length];
            entity.lifetime = 0;
            return entity;
        }
    }
}

export async function loadEntities(audioContext) {
    const entityFactories = {};

    function setup(loader) {
        return loader(audioContext);
    }

    function addAs(name) {
        return function addFactory(factory) {
            entityFactories[name] = factory;
        }
    }

    await Promise.all([
        setup(loadMario)
            .then(addAs('mario')),
        setup(loadPiranhaPlant)
            .then(addAs('piranha-plant')),
        setup(loadGoombaBrown)
            .then(addAs('goomba-brown')),
        setup(loadGoombaBlue)
            .then(addAs('goomba-blue')),
        setup(loadKoopaGreen)
            .then(addAs('koopa-green')),
        setup(loadKoopaBlue)
            .then(addAs('koopa-blue')),
        setup(loadCheepSlow)
            .then(addAs('cheep-slow')),
        setup(loadCheepFast)
            .then(addAs('cheep-fast')),
        setup(loadCheepSlowWavy)
            .then(addAs('cheep-slow-wavy')),
        setup(loadCheepFastWavy)
            .then(addAs('cheep-fast-wavy')),
        setup(loadBullet)
            .then(addAs('bullet')),
        setup(loadCannon)
            .then(addAs('cannon')),
        setup(loadPipePortal)
            .then(addAs('pipe-portal')),
        setup(loadFlagPole)
            .then(addAs('flag-pole')),
        setup(loadBrickShrapnel)
            .then(createPool(8))
            .then(addAs('brickShrapnel')),
        setup(loadLetter)
            .then(addAs('letter')),
        setup(loadFireball)
            .then(addAs('fireball')),
        setup(loadDataroPowerup)
            .then(addAs('dataro-powerup')),
        setup(loadDonorBusiness)
            .then(addAs('donor-business')),
        setup(loadDonorCasual)
            .then(addAs('donor-casual')),
        setup(loadDonorFormal)
            .then(addAs('donor-formal')),
        setup(loadSpreadzy)
            .then(addAs('spreadzy')),
        setup(loadBouncer)
            .then(addAs('bouncer')),
        setup(loadDuper)
            .then(addAs('duper')),
        setup(loadSnippy)
            .then(addAs('snippy')),
    ]);

    return entityFactories;
}
