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
// Pass `petHearts` (usePetCare's hearts, 0-4) and the pet gets hungry: at 2
// or fewer a food bubble bobs over its head; at 0 it stops and lies down on
// the spot (PetCompanion's `lying`), the bubble gets a red ring and bobs
// faster, and it finds no coins (any already down wait for it) until it's
// fed. Coins show what they pay at the pet's bond level (petBond.js). A
// small hearts pill sits in the stage's corner, and when the hearts go up
// the pet hops and a heart floats off it. Pass `onPetPress` and
// the pet, its bubble and the pill all open the feeding sheet
// (PetCareSheet.js). Omit `petHearts` and there's no hunger at all. Like the
// arrows, these carry no button role: on Training the whole stage sits inside
// one tappable hero, and a button inside a button is invalid on web.
//
// With hunger on, the pet's food bowl sits on the ground (`bowlX`, which the
// player can move in the Decorate sheet) with food in it while the pet is
// fed, and empty once it's hungry; tapping it opens the same feeding sheet.
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
import PixelArt from './PixelArt';
import useAppActive from '../logic/useAppActive';
import { DEFAULT_BOWL_X } from '../logic/stageDecor';
import { MAX_HEARTS } from '../logic/petHunger';
import { petScale, coinValue, MAX_BOND_LEVEL } from '../logic/petBond';

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
const COIN_SPAWN_MIN_MS = 4000;  // how often a new coin appears on the ground (no reward rules wired)
const COIN_SPAWN_MAX_MS = 8000;
const MAX_COINS = 3;             // keep the ground from getting cluttered
const FIRST_COIN_MS = 8000;      // with nextCoinAt: the soonest a coin appears after the stage does

const CharacterWalker = forwardRef(function CharacterWalker({
  outfit, accessory, pet, characterSize = 100, petSize: basePetSize = 42,
  rewards, onClaimReward, rewardPoints = 15,
  onCoinCollected, coinRewardsRemaining, coinRewardPoints = 1,
  // From useCoinRewards: when the next coin can pay. With it, one coin is
  // put down at that moment (every 3 minutes, none past the day's 50), so
  // every coin the pet eats is a real one. Without it, coins keep popping up
  // every few seconds as decoration, like before.
  nextCoinAt,
  // The up (jump) arrow. Hidden when a tap on the character already jumps
  // (Customize → "Tap your character to open Profile" off): two ways to do
  // one thing. Left and right always stay; they're the only way to walk.
  showJumpArrow = true,
  // A tap anywhere on the stage jumps. Profile turns this on with the jump
  // arrow off; Training's stage has its own tap (Profile or jump).
  tapToJump = false,
  petHearts, onPetPress, heartsPillStyle,
  // From usePetCare: its name (the one you gave it, or the species), its bond
  // level (it grows a little each one, and wears a ribbon as a Best buddy),
  // and whether its daily gift is waiting (a gift shows on the hearts pill).
  petName, petLevel = 1, petGiftReady = false,
  // Where the food bowl sits, as a fraction of the stage width.
  bowlX = DEFAULT_BOWL_X,
}, ref) {
  const petSize = Math.round(basePetSize * petScale(petLevel));
  const bowlSize = Math.round(basePetSize * 0.55); // the bowl's drawn width
  const petLabel = petName || pet?.name;
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
  const bubbleBob = useRef(new Animated.Value(0)).current;
  const petHop = useRef(new Animated.Value(0)).current;
  const fedFloat = useRef(new Animated.Value(0)).current;
  const [fedHeart, setFedHeart] = useState(false); // a heart floating off the pet after it eats
  const prevHearts = useRef(petHearts);
  const isStatic = !outfit.rig; // no walk-cycle art — use the hop instead
  // Everything that runs on its own (bobbing rewards, spinning coins, the
  // pet's wandering and coin finding) keeps going on every screen: being in
  // the app is what the coins reward. It pauses only while the app is in
  // the background (src/logic/useAppActive.js).
  const appOpen = useAppActive();

  const hungry = petHearts === 0;
  const wantsFood = petHearts != null && petHearts <= 2;
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
    if (!hasUnclaimed || !appOpen) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rewardBob, { toValue: -6, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rewardBob, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [hasUnclaimed, rewardBob, appOpen]);

  // Coins spin in place (a flattening scaleX) so they read as coins, not
  // static dots.
  useEffect(() => {
    if (!coins.length || !appOpen) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(coinSpin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(coinSpin, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [coins.length, coinSpin, appOpen]);

  // The pet wanders on its own — pick a new random spot every few
  // seconds and amble toward it, no controls involved. A hungry pet lies
  // where it is until it's fed.
  useEffect(() => {
    if (hungry) { setPetTargetX(null); return; }
    if (stageWidth <= 0 || !appOpen) return;
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
  }, [stageWidth, petMaxX, appOpen, hungry]);

  // Step the pet toward wherever it's currently wandering to, and check
  // whether it's close enough to a coin to eat it along the way.
  useEffect(() => {
    if (petTargetX == null || !appOpen || hungry) return;
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
  }, [petTargetX, petMaxX, appOpen, hungry]);

  // A coin appears on the ground every so often, up to a small cap.
  // Paced by the reward rules: one coin, put down when it can pay.
  useEffect(() => {
    // Infinity = the saved timing hasn't loaded yet. (setTimeout treats an
    // endless delay as zero, so it has to be skipped here, not scheduled.)
    // No pet yet (before the first game, see petsOpen): nothing to find coins.
    // A hungry pet finds nothing until it's fed.
    if (!pet || hungry || nextCoinAt === undefined || !Number.isFinite(nextCoinAt) || stageWidth <= 0 || !appOpen || coins.length) return undefined;
    // Past the day's 50, nextCoinAt is when the 24-hour window frees one up,
    // so this simply waits until then.
    const delay = Math.max(FIRST_COIN_MS, nextCoinAt - Date.now());
    const timeoutId = setTimeout(() => {
      setCoins(prev => (prev.length ? prev : [{ id: coinIdRef.current++, xFraction: 0.1 + Math.random() * 0.8 }]));
    }, delay);
    return () => clearTimeout(timeoutId);
  }, [nextCoinAt, stageWidth, appOpen, coins.length, pet, hungry]);

  useEffect(() => {
    if (!pet || hungry || nextCoinAt !== undefined || stageWidth <= 0 || !appOpen) return;
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
  }, [stageWidth, appOpen, nextCoinAt, pet, hungry]);

  // When the pet's wandering brings it close enough to a coin, eat it —
  // and, if there's still allowance left this cycle, credit it for real.
  useEffect(() => {
    if (petX == null || !coins.length || stageWidth <= 0 || hungry) return;
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
  }, [petX, coins, stageWidth, petSize, coinPopScale, onCoinCollected, coinRewardsRemaining, coinPopupAnim, hungry]);

  // The food bubble bobs over a pet that wants feeding.
  useEffect(() => {
    if (!wantsFood || !appOpen) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleBob, { toValue: -4, duration: hungry ? 380 : 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bubbleBob, { toValue: 0, duration: hungry ? 380 : 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [wantsFood, hungry, appOpen, bubbleBob]);

  // Just fed: two happy hops and a heart floating off the pet.
  useEffect(() => {
    const before = prevHearts.current;
    prevHearts.current = petHearts;
    if (before == null || petHearts == null || petHearts <= before) return;
    petHop.setValue(0);
    fedFloat.setValue(0);
    setFedHeart(true);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(petHop, { toValue: -12, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(petHop, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(petHop, { toValue: -8, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(petHop, { toValue: 0, duration: 120, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.timing(fedFloat, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => setFedHeart(false));
  }, [petHearts, petHop, fedFloat]);

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
  // What a coin pays at the pet's bond level (Buddy 2, Best buddy 3), so the
  // coin's face matches the "+N" when it's eaten.
  const coinLabel = `${coinValue(petLevel)}¢`;

  // Not every sprite pack's art faces the same way by default — verified
  // per-item (see the `facingRight` comments in characterOptions.js /
  // petOptions.js), so "unflipped" doesn't always mean "facing right".
  const outfitFacesRight = outfit.facingRight !== false;
  const charFlip = outfitFacesRight ? facing === 'left' : facing === 'right';
  const petFacesRight = pet?.facingRight !== false;
  const petFlip = petFacesRight ? petFacing === 'left' : petFacing === 'right';

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="box-none">
      {tapToJump && (
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={doJump}
          accessibilityRole="button" accessibilityLabel="Make your character jump" />
      )}
      {!!pet && petHearts != null && stageWidth > 0 && (
        <TouchableOpacity
          style={{ position: 'absolute', left: stageWidth * bowlX - bowlSize / 2, bottom: 6 }}
          onPress={onPetPress}
          disabled={!onPetPress}
          hitSlop={8}
          activeOpacity={0.8}
          accessibilityLabel={`${petLabel}'s bowl, ${wantsFood ? 'empty' : 'full'}. Feed`}
        >
          <PixelArt art={wantsFood ? 'emptyBowl' : 'bowlBlue'} height={bowlSize * (37 / 43)} />
        </TouchableOpacity>
      )}

      {x != null && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: x,
            bottom: 10,
            width: characterSize,
            height: characterSize,
            transform: [{ translateY: verticalOffset }],
          }}
        >
          {/* The flip lives on its own plain View. On the same transform as
              the native-driven bob/jump, a changed scaleX stopped reaching
              the screen once those animations had run, so after a few runs
              back and forth the character walked backwards (2026-10-15). */}
          <View style={{ width: characterSize, height: characterSize, transform: [{ scaleX: charFlip ? -1 : 1 }] }}>
            <PlayerCharacter outfit={outfit} accessory={accessory} walking={walking} size={characterSize} />
          </View>
        </Animated.View>
      )}

      {!!pet && petX != null && (
        <Animated.View
          style={{
            position: 'absolute', left: petX, bottom: 6,
            width: petSize, height: petSize,
            transform: [{ translateY: petHop }],
          }}
          pointerEvents={onPetPress ? 'auto' : 'none'}
        >
          <TouchableOpacity
            onPress={onPetPress}
            disabled={!onPetPress}
            activeOpacity={0.8}
            hitSlop={8}
            accessibilityLabel={petHearts != null ? `${petLabel}, ${petHearts} of ${MAX_HEARTS} hearts. Feed` : petLabel}
          >
            {/* Flip on its own plain View, not beside the native-driven hop:
                same reason as the character's above. */}
            <View style={{ width: petSize, height: petSize, transform: [{ scaleX: petFlip ? -1 : 1 }] }}>
              <PetCompanion pet={pet} size={petSize} lying={hungry} />
            </View>
            {petLevel >= MAX_BOND_LEVEL && (
              <View style={styles.petRibbon} pointerEvents="none">
                <Ionicons name="ribbon" size={13} color="#e8b34a" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {!!pet && petX != null && wantsFood && (
        <Animated.View
          style={{
            position: 'absolute', left: petX + petSize / 2 - 13, bottom: 6 + petSize + 2,
            transform: [{ translateY: bubbleBob }],
          }}
          pointerEvents={onPetPress ? 'auto' : 'none'}
        >
          <TouchableOpacity onPress={onPetPress} disabled={!onPetPress} hitSlop={8} activeOpacity={0.8}
            accessibilityLabel={`${petLabel} is ${hungry ? 'hungry' : 'getting hungry'}. Feed`}>
            <View style={[styles.bubble, hungry && styles.bubbleHungry]}>
              <PixelArt art="drumstick" height={13} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {!!pet && petX != null && fedHeart && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', left: petX + petSize / 2 - 8, bottom: 6 + petSize,
            opacity: fedFloat.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
            transform: [{ translateY: fedFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) }],
          }}
        >
          <Ionicons name="heart" size={16} color="#ff6b6b" />
        </Animated.View>
      )}

      {!!pet && petHearts != null && (
        <TouchableOpacity
          style={[styles.heartsPill, heartsPillStyle]}
          onPress={onPetPress}
          disabled={!onPetPress}
          hitSlop={6}
          activeOpacity={0.8}
          accessibilityLabel={`${petLabel}: ${petHearts} of ${MAX_HEARTS} hearts.${petGiftReady ? ' A gift is waiting.' : ''} Feed`}
        >
          {Array.from({ length: MAX_HEARTS }, (_, i) => (
            <Ionicons key={i} name={i < petHearts ? 'heart' : 'heart-outline'} size={10} color={i < petHearts ? '#ff6b6b' : 'rgba(255,255,255,0.75)'} />
          ))}
          {petGiftReady && <Ionicons name="gift" size={10} color="#e8b34a" style={{ marginLeft: 3 }} />}
        </TouchableOpacity>
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
            <Text style={styles.coinText}>{coinLabel}</Text>
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
            <Text style={styles.coinText}>{coinLabel}</Text>
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
      {showJumpArrow && (
      <TouchableOpacity
        style={[styles.arrow, styles.arrowUp]}
        onPress={doJump}
        activeOpacity={0.7}
        accessibilityLabel="Jump"
      >
        <Ionicons name="chevron-up" size={20} color="#fff" />
      </TouchableOpacity>
      )}
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
  heartsPill: {
    position: 'absolute', top: 8, left: 8, flexDirection: 'row', gap: 2,
    paddingHorizontal: 6, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bubble: {
    width: 26, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff8e8', borderWidth: 1.5, borderColor: '#e8b34a',
  },
  // White with a red ring, not a filled red dot: that read as an error badge.
  petRibbon: { position: 'absolute', bottom: -2, right: -6 },
  bubbleHungry: { backgroundColor: '#ffffff', borderColor: '#c43030', borderWidth: 2 },
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
  coinText: { fontSize: 11, fontWeight: '900', color: '#fff2e0' },
  popupText: {
    color: '#fff', fontSize: 16, fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  coinPopupText: {
    color: '#e0b060', fontSize: 12, fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
});
