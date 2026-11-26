import type { BetaMapId } from '../shared/types';
import blastyardFloor from '../assets/images/beta_floor_blastyard_1795676058159.jpg';
import dunesFloor from '../assets/images/terrain_dunes.jpg';
import glacierFloor from '../assets/images/terrain_glacier.jpg';
import magmaFloor from '../assets/images/terrain_magma.jpg';
import overgrowthFloor from '../assets/images/beta_floor_overgrowth_1795676054828.jpg';
import sentinelFloor from '../assets/images/beta_floor_sentinel_1795676059216.jpg';
import stormFloor from '../assets/images/terrain_storm.jpg';

export const BETA_FLOOR_URLS: Record<BetaMapId, string> = {
  dunes: dunesFloor,
  glacier: glacierFloor,
  magma: magmaFloor,
  storm: stormFloor,
  sentinel: sentinelFloor,
  overgrowth: overgrowthFloor,
  blastyard: blastyardFloor,
};
