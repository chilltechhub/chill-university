// src/components/CharacterWalker.js
// Makes the player character walkable (and jumpable) inside its landscape
// stage: hold the left/right arrows to move, tap the up arrow to jump.
//
// The equipped outfit (src/data/characterOptions.js) is either a real
// animated rig (idle/walk frames — PlayerCharacter swaps the animation
// itself) or a static single-pose 32rogues portrait. For the static ones
// there's no walk-cycle art to play, so this component adds a little hop
// while moving to sell the motion instead. Both kinds get flipped to face
// the direction of travel, and both jump the same way (a vertical arc,
// independent of the walk-cycle/hop).
//
// Pass `rewards` (see useBonusRewards.js — a batch of 2-4 collectibles
// that recharges every 6 hours) to float collectibles across the stage at
// their given x-fractions; jumping while standing under an unclaimed one
// grabs it. Omit it and this is just a walk-and-jump toy with nothing to
// collect.
//
// The pet is fully autonomous: it wanders the stage on its own (no
// controls) and coins spawn on the ground at random spots every so often;
// when the pet's wandering brings it near one, it eats it. Each coin
// eaten is real — pass `onCoinCollected` (see useCoinRewards.js) and it
// goes through the same points pipeline as everything else, just a much
// smaller, per-cycle-capped amount, since the pet does this with zero
// player input. Pass `coinRewardsRemaining` (that hook's `remaining`) so
// this only shows a "+N" popup for coins that actually earned something —
// once the cap's hit for the cycle, the pet keeps eating for the ambience
// but stops implying it's still earning.
//
// Meant to sit as a LandscapeBackground's child: it fills the stage
// (absoluteFill) and lets taps outside the arrows pass through to
// whatever's behind it (pointerEvents="box-none").
//
// Forwards a ref exposing `.jump()` so a parent can trigger the same jump
// as the up-arrow — e.g. GamesScreen's hero wrapper calls it when the
// "tap to open Profile" setting is off, so the tap does something instead
// of nothing.

import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlayerCharacter from './PlayerCharacter';
import PetCompanion from './PetCompanion';

const STEP = 4;           // px moved per tick while holding an arrow
const TICK_MS = 24;       // ms per movement tick (~40 ticks/sec)
const JUMP_HEIGHT = 58;   // px risen at the peak of a jump
const JUMP_MS = 230;      // duration of each half (up or down) of a jump
const REWARD_SIZE = 34;
const COLLECT_RANGE = 46; // how close the character's center must be to a reward's center, in px

const PET_STEP = 2;              // px moved per tick — slower than the player, feels like ambling
const PET_TICK_MS = 40;
const PET_WANDER_MIN_MS = 2500;  // how often the pet picks a new place to wander to
const PET_WANDER_MAX_MS = 5500;
const PET_EAT_RANGE = 22;        // how close the pet's center must be to a coin's center, in px
const COIN_SIZE = 18;
const COIN_SPAWN_MIN_MS = 4000;  // how often a new coin appears on the ground
const COIN_SPAWN_MAX_MS = 8000;
const MAX_COINS = 3;             // keep the ground from getting cluttered

const CharacterWalker = forwardRef(function CharacterWalker({
  outfit, accessory, pet, characterSize = 100, petSize = 42,
  rewards, onClaimReward, rewardPoints = 15,
  onCoinCollected, coinRewardsRemaining, coinRewardPoints = 1,
}, ref) {
  const [stageWidth, setStageWidth] = useState(0);
  const [x, setX] = useState(null); // null until the first layout centers it
  const [facing, setFacing] = useState('right');
  const [walking, setWalking] = useState(false);
  const [poppingIndex, setPoppingIndex] = useState(null); // reward mid collect-animation
  const [popup, setPopup] = useState(null); // { text, xFraction } while the "+N" animates out
  const [petX, setPetX] = useState(null);
  const [petFacing, setPetFacing] = useState('left');
  const [petTargetX, setPetTargetX] = useState(null);
  const [coins, setCoins] = useState([]); // [{ id, xFraction }]
  const [poppingCoinId, setPoppingCoinId] = useState(null);
  const [coinPopup, setCoinPopup] = useState(null); // { text, x } while a "+N" floats up from an eaten coin
  const movingRef = useRef(null);
  const jumpingRef = useRef(false);
  const coinIdRef = useRef(0);
  const bob = useRef(new Animated.Value(0)).current;
  const jump = useRef(new Animated.Value(0)).current;
  const rewardBob = useRef(new Animated.Value(0)).current;
  const rewardScale = useRef(new Animated.Value(1)).current;
  const popupAnim = useRef(new Animated.Value(0)).current;
  const coinSpin = useRef(new Animated.Value(0)).current;
  const coinPopScale = useRef(new Animated.Value(1)).current;
  const coinPopupAnim = useRef(new Animated.Value(0)).current;
  const isStatic = !outfit.rig; // no walk-cycle art — use the hop instead

  const hasUnclaimed = !!rewards?.some(r => !r.claimed);
  const maxX = Math.max(0, stageWidth - characterSize);
  const petMaxX = Math.max(0, stageWidth - petSize);
  const verticalOffset = Animated.add(bob, jump);

  const onLayout = (e) => {
    const w = e.nativeEvent.layout.width;
    setStageWidth(w);
    setX(prev => {
      const bound = Math.max(0, w - characterSize);
      return prev == null ? bound / 2 : Math.min(prev, bound);
    });
    setPetX(prev => {
      const bound = Math.max(0, w - petSize);
      return prev == null ? bound * 0.75 : Math.min(prev, bound);
    });
  };

  // Every unclaimed collectible bobs gently in place together — a little
  // life so they read as "reach for these" rather than static icons.
  useEffect(() => {
    if (!hasUnclaimed) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rewardBob, { toValue: -6, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rewardBob, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [hasUnclaimed, rewardBob]);

  // Coins spin in place (a flattening scaleX) so they read as coins, not
  // static dots.
  useEffect(() => {
    if (!coins.length) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(coinSpin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(coinSpin, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [coins.length, coinSpin]);

  // The pet wanders on its own — pick a new random spot every few
  // seconds and amble toward it, no controls involved.
  useEffect(() => {
    if (stageWidth <= 0) return;
    let cancelled = false;
    let timeoutId;
    const pickNext = () => {
      const delay = PET_WANDER_MIN_MS + Math.random() * (PET_WANDER_MAX_MS - PET_WANDER_MIN_MS);
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setPetTargetX(Math.random() * petMaxX);
        pickNext();
      }, delay);
    };
    setPetTargetX(Math.random() * petMaxX);
    pickNext();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [stageWidth, petMaxX]);

  // Step the pet toward wherever it's currently wandering to, and check
  // whether it's close enough to a coin to eat it along the way.
  useEffect(() => {
    if (petTargetX == null) return;
    const id = setInterval(() => {
      setPetX(prev => {
        if (prev == null) return prev;
        const diff = petTargetX - prev;
        if (Math.abs(diff) <= PET_STEP) return prev;
        const dir = diff > 0 ? 1 : -1;
        setPetFacing(dir > 0 ? 'right' : 'left');
        return Math.max(0, Math.min(petMaxX, prev + dir * PET_STEP));
      });
    }, PET_TICK_MS);
    return () => clearInterval(id);
  }, [petTargetX, petMaxX]);

  // A coin appears on the ground every so often, up to a small cap.
  useEffect(() => {
    if (stageWidth <= 0) return;
    let cancelled = false;
    let timeoutId;
    const scheduleNext = () => {
      const delay = COIN_SPAWN_MIN_MS + Math.random() * (COIN_SPAWN_MAX_MS - COIN_SPAWN_MIN_MS);
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setCoins(prev => (prev.length >= MAX_COINS ? prev : [...prev, { id: coinIdRef.current++, xFraction: 0.1 + Math.random() * 0.8 }]));
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [stageWidth]);

  // When the pet's wandering brings it close enough to a coin, eat it —
  // and, if there's still allowance left this cycle, credit it for real.
  useEffect(() => {
    if (petX == null || !coins.length || stageWidth <= 0) return;
    const petCenterX = petX + petSize / 2;
    const target = coins.find(c => Math.abs(petCenterX - stageWidth * c.xFraction) < PET_EAT_RANGE);
    if (!target) return;
    setCoins(prev => prev.filter(c => c.id !== target.id));
    setPoppingCoinId(target.id);
    coinPopScale.setValue(1);
    Animated.sequence([
      Animated.timing(coinPopScale, { toValue: 1.6, duration: 120, useNativeDriver: true }),
      Animated.timing(coinPopScale, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => setPoppingCoinId(null));

    // Only claim (and only promise a "+N") when the caller says there's
    // still cap left — coinRewardsRemaining undefined (no cap wired up)
    // is treated as "go ahead," same as omitting `rewards` upstream.
    if (onCoinCollected && coinRewardsRemaining !== 0) {
      const eatenAtX = petCenterX;
      onCoinCollected().then((awarded) => {
        if (!awarded) return;
        setCoinPopup({ text: `+${awarded}`, x: eatenAtX });
        coinPopupAnim.setValue(0);
        Animated.timing(coinPopupAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true })
          .start(() => setCoinPopup(null));
      }).catch(() => {});
    }
  }, [petX, coins, stageWidth, petSize, coinPopScale, onCoinCollected, coinRewardsRemaining, coinPopupAnim]);

  const startBob = useCallback(() => {
    if (!isStatic) return;
    bob.stopAnimation();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -5, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [bob, isStatic]);

  const stopBob = useCallback(() => {
    bob.stopAnimation();
    Animated.timing(bob, { toValue: 0, duration: 100, useNativeDriver: true }).start();
  }, [bob]);

  const step = useCallback((dir) => {
    setX(prev => {
      const cur = prev ?? 0;
      const next = dir === 'left' ? cur - STEP : cur + STEP;
      return Math.max(0, Math.min(maxX, next));
    });
  }, [maxX]);

  const startMoving = (dir) => {
    setFacing(dir);
    setWalking(true);
    startBob();
    step(dir);
    if (movingRef.current) clearInterval(movingRef.current);
    movingRef.current = setInterval(() => step(dir), TICK_MS);
  };

  const stopMoving = () => {
    if (movingRef.current) { clearInterval(movingRef.current); movingRef.current = null; }
    setWalking(false);
    stopBob();
  };

  const collectReward = useCallback((item) => {
    onClaimReward?.(item.index);
    setPoppingIndex(item.index);
    setPopup({ text: `+${rewardPoints}`, xFraction: item.xFraction });
    popupAnim.setValue(0);
    rewardScale.setValue(1);
    Animated.timing(popupAnim, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true })
      .start(() => setPopup(null));
    Animated.sequence([
      Animated.timing(rewardScale, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.timing(rewardScale, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setPoppingIndex(null));
  }, [onClaimReward, rewardPoints, popupAnim, rewardScale]);

  const doJump = () => {
    if (jumpingRef.current || x == null) return;
    jumpingRef.current = true;
    Animated.sequence([
      Animated.timing(jump, { toValue: -JUMP_HEIGHT, duration: JUMP_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(jump, { toValue: 0, duration: JUMP_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => { jumpingRef.current = false; });

    if (rewards?.length && stageWidth > 0) {
      const characterCenterX = x + characterSize / 2;
      const target = rewards.find(r => !r.claimed && Math.abs(characterCenterX - stageWidth * r.xFraction) < COLLECT_RANGE);
      if (target) collectReward(target);
    }
  };

  useEffect(() => () => { if (movingRef.current) clearInterval(movingRef.current); }, []);

  useImperativeHandle(ref, () => ({ jump: doJump }));

  const coinScaleX = coinSpin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, -1, 1] });

  // Not every sprite pack's art faces the same way by default — verified
  // per-item (see the `facingRight` comments in characterOptions.js /
  // petOptions.js), so "unflipped" doesn't always mean "facing right".
  const outfitFacesRight = outfit.facingRight !== false;
  const charFlip = outfitFacesRight ? facing === 'left' : facing === 'right';
  const petFacesRight = pet?.facingRight !== false;
  const petFlip = petFacesRight ? petFacing === 'left' : petFacing === 'right';

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="box-none">
      {x != null && (
        <Animated.View
          style={{
            position: 'absolute',
            left: x,
            bottom: 10,
            width: characterSize,
            height: characterSize,
            transform: [{ translateY: verticalOffset }, { scaleX: charFlip ? -1 : 1 }],
          }}
        >
          <PlayerCharacter outfit={outfit} accessory={accessory} walking={walking} size={characterSize} />
        </Animated.View>
      )}

      {petX != null && (
        <View
          style={{
            position: 'absolute', left: petX, bottom: 6,
            width: petSize, height: petSize,
            transform: [{ scaleX: petFlip ? -1 : 1 }],
          }}
          pointerEvents="none"
        >
          <PetCompanion pet={pet} size={petSize} />
        </View>
      )}

      {stageWidth > 0 && coins.map(item => (
        <Animated.View
          key={item.id}
          style={{
            position: 'absolute',
            left: stageWidth * item.xFraction - COIN_SIZE / 2,
            bottom: 12,
            width: COIN_SIZE, height: COIN_SIZE,
            transform: [{ scaleX: coinScaleX }],
          }}
          pointerEvents="none"
        >
          <View style={styles.coin}>
            <Text style={styles.coinText}>1¢</Text>
          </View>
        </Animated.View>
      ))}

      {stageWidth > 0 && poppingCoinId != null && !coins.some(c => c.id === poppingCoinId) && (
        <Animated.View
          style={{
            position: 'absolute',
            left: petX + petSize / 2 - COIN_SIZE / 2,
            bottom: 16,
            width: COIN_SIZE, height: COIN_SIZE,
            transform: [{ scale: coinPopScale }],
          }}
          pointerEvents="none"
        >
          <View style={styles.coin}>
            <Text style={styles.coinText}>1¢</Text>
          </View>
        </Animated.View>
      )}

      {stageWidth > 0 && rewards?.map(item => {
        if (item.claimed && poppingIndex !== item.index) return null;
        // A small stagger so a full batch doesn't float at one flat height.
        // Kept low enough to clear REWARD_SIZE (34) inside the shortest
        // scene this renders in (GamesScreen's 150px-tall hero, characterSize
        // 100) — the old +30/+46 offsets only fit ProfileScreen's taller
        // 200px scene and pushed these badges up past the top edge (clipped)
        // everywhere else.
        const restHeight = characterSize + (item.index % 2 === 0 ? 4 : 12);
        return (
          <Animated.View
            key={item.index}
            style={{
              position: 'absolute',
              left: stageWidth * item.xFraction - REWARD_SIZE / 2,
              bottom: restHeight,
              width: REWARD_SIZE,
              height: REWARD_SIZE,
              transform: [
                { translateY: rewardBob },
                { scale: poppingIndex === item.index ? rewardScale : 1 },
              ],
            }}
            pointerEvents="none"
          >
            <View style={styles.rewardOrb}>
              <Ionicons name="gift" size={18} color="#fff" />
            </View>
          </Animated.View>
        );
      })}

      {popup && stageWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: stageWidth * popup.xFraction - 20,
            bottom: characterSize + 30,
            opacity: popupAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
            transform: [{ translateY: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -34] }) }],
          }}
        >
          <Text style={styles.popupText}>{popup.text}</Text>
        </Animated.View>
      )}

      {coinPopup && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: coinPopup.x - 14,
            bottom: 30,
            opacity: coinPopupAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
            transform: [{ translateY: coinPopupAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }],
          }}
        >
          <Text style={styles.coinPopupText}>{coinPopup.text}</Text>
        </Animated.View>
      )}

      <TouchableOpacity
        style={[styles.arrow, styles.arrowLeft]}
        onPressIn={() => startMoving('left')}
        onPressOut={stopMoving}
        activeOpacity={0.7}
        accessibilityLabel="Walk left"
      >
        <Ionicons name="chevron-back" size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.arrow, styles.arrowRight]}
        onPressIn={() => startMoving('right')}
        onPressOut={stopMoving}
        activeOpacity={0.7}
        accessibilityLabel="Walk right"
      >
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.arrow, styles.arrowUp]}
        onPress={doJump}
        activeOpacity={0.7}
        accessibilityLabel="Jump"
      >
        <Ionicons name="chevron-up" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
});

export default CharacterWalker;

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  arrowLeft: { top: '50%', marginTop: -17, left: 8 },
  arrowRight: { top: '50%', marginTop: -17, right: 8 },
  arrowUp: { bottom: 8, left: '50%', marginLeft: -17 },
  rewardOrb: {
    width: '100%', height: '100%', borderRadius: 17,
    backgroundColor: '#e8b34a', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff8e0',
    shadowColor: '#e8b34a', shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
  },
  coin: {
    width: '100%', height: '100%', borderRadius: COIN_SIZE / 2,
    backgroundColor: '#b0703f', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#e0a878',
  },
  coinText: { fontSize: 8, fontWeight: '900', color: '#fff2e0' },
  popupText: {
    color: '#fff', fontSize: 16, fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  coinPopupText: {
    color: '#e0b060', fontSize: 12, fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
});
