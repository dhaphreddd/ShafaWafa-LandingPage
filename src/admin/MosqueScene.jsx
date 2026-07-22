import React, { useEffect, useRef } from "react";
import { formatImageUrl } from "../utils/imageHelper";

export default function MosqueScene({ timeStr, dateStr }) {
  const canvasRef = useRef(null);
  const mountRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    let cleanupFn = () => {};

    const initThree = () => {
      const THREE = window.THREE;
      if (!THREE) return;

      const W = canvasRef.current.clientWidth;
      const H = canvasRef.current.clientHeight;

      // ─── SCENE ────────────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0e1b29, 0.012);

      // ─── RENDERER ─────────────────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: false });
      renderer.setSize(W, H, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = false;

      if (THREE.sRGBEncoding !== undefined) {
        renderer.outputEncoding = THREE.sRGBEncoding;
      }

      // ─── CAMERA ───────────────────────────────────────────────────────────
      const camera = new THREE.PerspectiveCamera(35, W / H, 0.5, 350);
      camera.position.set(0, 5.5, 30);
      camera.lookAt(0, 2.5, 0);

      // ─── LIGHTS ───────────────────────────────────────────────────────────
      const hemiLight = new THREE.HemisphereLight(0x7da2c4, 0x5a4f40, 0.65);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xffebd2, 1.2);
      sunLight.position.set(12, 18, 10);
      scene.add(sunLight);

      const fillLight = new THREE.DirectionalLight(0x4a739c, 0.45);
      fillLight.position.set(-8, 6, -4);
      scene.add(fillLight);

      const backLight = new THREE.DirectionalLight(0x6a8ab8, 0.5);
      backLight.position.set(0, 10, -15);
      scene.add(backLight);

      const portalGlow = new THREE.PointLight(0xff9922, 1.4, 8.5);
      portalGlow.position.set(0, 1.4, 2.6);
      scene.add(portalGlow);

      const domeLight = new THREE.PointLight(0xffa834, 0.9, 6);
      domeLight.position.set(0, 4.8, 0);
      scene.add(domeLight);

      // ─── MATERIALS ────────────────────────────────────────────────────────
      const mkMarble = (shininessVal = 20, colorHex = 0xe5e1d7) =>
        new THREE.MeshPhongMaterial({ color: colorHex, shininess: shininessVal, side: THREE.DoubleSide });

      const wallMat       = mkMarble(15, 0xdfdad0);
      const trimMat       = mkMarble(25, 0xeae6dc);
      const columnMat     = mkMarble(20, 0xd8d3c7);

      const goldMat       = new THREE.MeshPhongMaterial({ color: 0xc89628, emissive: 0x3d2700, shininess: 80, side: THREE.DoubleSide });
      const goldBrightMat = new THREE.MeshPhongMaterial({ color: 0xdfaa30, emissive: 0x473200, shininess: 90, side: THREE.DoubleSide });
      const glassMat      = new THREE.MeshPhongMaterial({ color: 0x11151e, emissive: 0x050505, shininess: 100, side: THREE.DoubleSide });

      const floorMat      = new THREE.MeshLambertMaterial({ color: 0xc2beb4, side: THREE.DoubleSide });
      const pathMat       = new THREE.MeshLambertMaterial({ color: 0xd2cebf, side: THREE.DoubleSide });
      const grassMat      = new THREE.MeshLambertMaterial({ color: 0x2a3e2c, side: THREE.DoubleSide });
      const shrubMat      = new THREE.MeshLambertMaterial({ color: 0x1f3423, side: THREE.DoubleSide });
      const trunkMat      = new THREE.MeshLambertMaterial({ color: 0x5a483c, side: THREE.DoubleSide });
      const leafMat       = new THREE.MeshLambertMaterial({ color: 0x2e4433, side: THREE.DoubleSide });

      const waterMat      = new THREE.MeshPhongMaterial({ color: 0x3d6b7c, shininess: 90, transparent: true, opacity: 0.85 });
      const lampMat       = new THREE.MeshLambertMaterial({ color: 0x1c1c1c });
      const lampGlowMat   = new THREE.MeshBasicMaterial({ color: 0xfff3d1, transparent: true, opacity: 0.95 });

      const lobbyGlowMat  = new THREE.MeshBasicMaterial({ color: 0xffdb73, side: THREE.DoubleSide });

      const box    = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      const cyl    = (rt, rb, h, seg, mat) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      const sphere = (r, sw, sh, mat) => new THREE.Mesh(new THREE.SphereGeometry(r, sw, sh), mat);

      // ─── MOSQUE GROUP ─────────────────────────────────────────────────────
      const mosque = new THREE.Group();
      mosque.scale.set(1.35, 1.35, 1.35);
      scene.add(mosque);

      // Building center Z position (all walls centered here)
      const BZ = -1.0;
      // Building full depth
      const BD = 4.0;
      // Front face Z
      const FZ = BZ + BD / 2; // = 1.0

      // 1. GROUND PLAZA
      const plaza = box(18, 0.18, 18, floorMat);
      plaza.position.set(0, -0.09, 0);
      mosque.add(plaza);

      // Central walkway
      const walkway = box(2.2, 0.21, 7.5, pathMat);
      walkway.position.set(0, -0.04, 3.5);
      mosque.add(walkway);

      // Garden beds
      const gardenL = box(4.5, 0.12, 8, grassMat);
      gardenL.position.set(-5.6, 0.02, 0.5);
      mosque.add(gardenL);
      const gardenR = gardenL.clone();
      gardenR.position.set(5.6, 0.02, 0.5);
      mosque.add(gardenR);

      // Shrub border row
      for (let i = 0; i < 5; i++) {
        const sh = box(0.55, 0.55, 0.55, shrubMat);
        sh.position.set(-7.2, 0.28, 1.8 - i * 1.5);
        mosque.add(sh);
        const shr = sh.clone();
        shr.position.set(7.2, 0.28, 1.8 - i * 1.5);
        mosque.add(shr);
      }

      // 2. MAIN BUILDING — Solid block structure (Clean plain marble back wall)
      const podium = box(14, 0.45, BD + 0.5, columnMat);
      podium.position.set(0, 0.225, BZ);
      mosque.add(podium);

      const podium2 = box(12.2, 0.3, BD, columnMat);
      podium2.position.set(0, 0.6, BZ);
      mosque.add(podium2);

      // Center Block — solid depth
      const centerH = 4.2;
      const centerBlock = box(3.2, centerH, BD, wallMat);
      centerBlock.position.set(0, 0.75 + centerH / 2, BZ);
      mosque.add(centerBlock);

      // Center cornice
      const cCor = box(3.6, 0.22, BD + 0.4, trimMat);
      cCor.position.set(0, 0.75 + centerH + 0.11, BZ);
      mosque.add(cCor);

      // Wings — solid depth
      const wingH = 3.2;
      const leftWing = box(3.4, wingH, BD, wallMat);
      leftWing.position.set(-3.2, 0.75 + wingH / 2, BZ);
      mosque.add(leftWing);
      const lWingCor = box(3.8, 0.18, BD + 0.4, trimMat);
      lWingCor.position.set(-3.2, 0.75 + wingH + 0.09, BZ);
      mosque.add(lWingCor);

      const rightWing = leftWing.clone();
      rightWing.position.set(3.2, 0.75 + wingH / 2, BZ);
      mosque.add(rightWing);
      const rWingCor = lWingCor.clone();
      rWingCor.position.set(3.2, 0.75 + wingH + 0.09, BZ);
      mosque.add(rWingCor);

      // Sides — solid depth
      const sideH = 2.4;
      const leftSide = box(2.2, sideH, BD, wallMat);
      leftSide.position.set(-5.8, 0.75 + sideH / 2, BZ);
      mosque.add(leftSide);
      const lSideCor = box(2.6, 0.14, BD + 0.4, trimMat);
      lSideCor.position.set(-5.8, 0.75 + sideH + 0.07, BZ);
      mosque.add(lSideCor);

      const rightSide = leftSide.clone();
      rightSide.position.set(5.8, 0.75 + sideH / 2, BZ);
      mosque.add(rightSide);
      const rSideCor = lSideCor.clone();
      rSideCor.position.set(5.8, 0.75 + sideH + 0.07, BZ);
      mosque.add(rSideCor);

      // Roof slab under dome drum to prevent gap transparency
      const roofSlab = box(3.6, 0.2, BD + 0.4, wallMat);
      roofSlab.position.set(0, 0.75 + centerH + 0.22, BZ);
      mosque.add(roofSlab);

      // Pilasters on front face ONLY
      [-1.4, 1.4].forEach((x) => {
        const pil = box(0.18, centerH + 0.45, 0.22, trimMat);
        pil.position.set(x, 0.75 + centerH / 2, FZ + 0.12);
        mosque.add(pil);
      });

      // Horizontal bands on front face ONLY
      [-3.2, 3.2].forEach((x) => {
        const band = box(3.5, 0.12, 0.12, trimMat);
        band.position.set(x, 0.75 + wingH * 0.55, FZ + 0.12);
        mosque.add(band);
      });

      // Decorative Panels on front face ONLY
      const makeGeomPanel = (x, y, z) => {
        const frame = box(2.4, 1.6, 0.08, trimMat);
        frame.position.set(x, y, z + 0.06);
        mosque.add(frame);
        const inner = box(2.1, 1.3, 0.06, wallMat);
        inner.position.set(x, y, z + 0.12);
        mosque.add(inner);
        for (let i = -1; i <= 1; i++) {
          const hLine = box(1.9, 0.04, 0.04, trimMat);
          hLine.position.set(x, y + i * 0.42, z + 0.16);
          mosque.add(hLine);
          const vLine = box(0.04, 1.2, 0.04, trimMat);
          vLine.position.set(x + i * 0.63, y, z + 0.16);
          mosque.add(vLine);
        }
      };

      makeGeomPanel(-3.2, 0.75 + wingH * 0.35, FZ);
      makeGeomPanel(3.2, 0.75 + wingH * 0.35, FZ);
      makeGeomPanel(-5.8, 0.75 + sideH * 0.38, FZ);
      makeGeomPanel(5.8, 0.75 + sideH * 0.38, FZ);

      // 3. POINTED ARCH WINDOWS (Front face ONLY)
      const addPointedWindow = (x, y, z, wScale = 1) => {
        const wg = new THREE.Group();
        wg.position.set(x, y, z);

        const frameGeo = new THREE.BoxGeometry(0.52 * wScale, 1.2, 0.1);
        const frame = new THREE.Mesh(frameGeo, trimMat);
        wg.add(frame);

        const paneGeo = new THREE.BoxGeometry(0.4 * wScale, 1.0, 0.04);
        const pane = new THREE.Mesh(paneGeo, glassMat);
        pane.position.z = 0.04;
        wg.add(pane);

        const archGeo = new THREE.TorusGeometry(0.18 * wScale, 0.03, 8, 16, Math.PI);
        const arch = new THREE.Mesh(archGeo, goldMat);
        arch.position.set(0, 0.5, 0.06);
        wg.add(arch);

        const mullion = box(0.03, 1.0, 0.05, goldMat);
        mullion.position.set(0, 0.1, 0.06);
        wg.add(mullion);

        const sill = box(0.62 * wScale, 0.08, 0.14, trimMat);
        sill.position.y = -0.64;
        wg.add(sill);

        mosque.add(wg);
      };

      addPointedWindow(-2.5, 0.75 + wingH * 0.5, FZ + 0.08);
      addPointedWindow(-3.2, 0.75 + wingH * 0.5, FZ + 0.08);
      addPointedWindow(-3.9, 0.75 + wingH * 0.5, FZ + 0.08);

      addPointedWindow(2.5, 0.75 + wingH * 0.5, FZ + 0.08);
      addPointedWindow(3.2, 0.75 + wingH * 0.5, FZ + 0.08);
      addPointedWindow(3.9, 0.75 + wingH * 0.5, FZ + 0.08);

      addPointedWindow(-5.8, 0.75 + sideH * 0.55, FZ + 0.08);
      addPointedWindow(5.8, 0.75 + sideH * 0.55, FZ + 0.08);

      // 4. DETAILED GRAND ENTRANCE & LOBBY (Front ONLY)
      const portalGroup = new THREE.Group();
      portalGroup.position.set(0, 0.75, FZ);

      const portalLeft = box(0.55, 3.2, 0.55, wallMat);
      portalLeft.position.set(-1.1, 1.6, 0.275);
      portalGroup.add(portalLeft);

      const portalRight = box(0.55, 3.2, 0.55, wallMat);
      portalRight.position.set(1.1, 1.6, 0.275);
      portalGroup.add(portalRight);

      const portalHeader = box(2.75, 0.8, 0.55, wallMat);
      portalHeader.position.set(0, 2.8, 0.275);
      portalGroup.add(portalHeader);

      const portalFillL = box(0.5, 1.2, 0.55, wallMat);
      portalFillL.position.set(-0.85, 1.8, 0.275);
      portalGroup.add(portalFillL);

      const portalFillR = box(0.5, 1.2, 0.55, wallMat);
      portalFillR.position.set(0.85, 1.8, 0.275);
      portalGroup.add(portalFillR);

      const outerArchGeo = new THREE.TorusGeometry(0.65, 0.08, 8, 24, Math.PI);
      const outerArch = new THREE.Mesh(outerArchGeo, wallMat);
      outerArch.position.set(0, 1.2, 0.55);
      portalGroup.add(outerArch);

      const midArchGeo = new THREE.TorusGeometry(0.58, 0.06, 8, 24, Math.PI);
      const midArch = new THREE.Mesh(midArchGeo, goldMat);
      midArch.position.set(0, 1.2, 0.57);
      portalGroup.add(midArch);

      mosque.add(portalGroup);

      // Glowing interior lobby walls inside front entrance
      const lobbyBack = box(1.5, 2.7, 0.1, lobbyGlowMat);
      lobbyBack.position.set(0, 0.75 + 1.35, FZ - 0.3);
      mosque.add(lobbyBack);

      const doorMat = new THREE.MeshLambertMaterial({ color: 0x422d17, side: THREE.DoubleSide });
      const innerDoorL = box(0.32, 1.4, 0.04, doorMat);
      innerDoorL.position.set(-0.17, 0.75 + 0.7, FZ - 0.25);
      mosque.add(innerDoorL);

      const innerDoorR = box(0.32, 1.4, 0.04, doorMat);
      innerDoorR.position.set(0.17, 0.75 + 0.7, FZ - 0.25);
      mosque.add(innerDoorR);

      const goldFrame = box(1.72, 0.12, 0.1, goldMat);
      goldFrame.position.set(0, 0.75 + 3.25 + 0.06, FZ + 0.3);
      mosque.add(goldFrame);

      const portalFinial = sphere(0.12, 10, 10, goldMat);
      portalFinial.position.set(0, 0.75 + 3.42, FZ + 0.4);
      mosque.add(portalFinial);

      // 5. DOME ASSEMBLY (Solid, non-floating drum base)
      const domeBase = 0.75 + centerH + 0.22;

      const drumBase = cyl(1.72, 1.72, 0.28, 24, columnMat);
      drumBase.position.set(0, domeBase + 0.14, BZ);
      mosque.add(drumBase);

      const drumRing = cyl(1.76, 1.76, 0.09, 24, goldMat);
      drumRing.position.set(0, domeBase + 0.04, BZ);
      mosque.add(drumRing);

      const drum = cyl(1.62, 1.7, 0.5, 24, wallMat);
      drum.position.set(0, domeBase + 0.28 + 0.25, BZ);
      mosque.add(drum);

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dw = box(0.22, 0.38, 0.06, glassMat);
        dw.position.set(Math.sin(angle) * 1.65, domeBase + 0.28 + 0.25, BZ + Math.cos(angle) * 1.65);
        dw.rotation.y = -angle;
        mosque.add(dw);
      }

      const drumTopRing = cyl(1.68, 1.68, 0.1, 24, trimMat);
      drumTopRing.position.set(0, domeBase + 0.28 + 0.5 + 0.05, BZ);
      mosque.add(drumTopRing);

      const drumGoldTopRing = cyl(1.66, 1.66, 0.06, 24, goldMat);
      drumGoldTopRing.position.set(0, domeBase + 0.28 + 0.5 + 0.1 + 0.03, BZ);
      mosque.add(drumGoldTopRing);

      const domeY = domeBase + 0.28 + 0.5 + 0.13;
      const domeR = 1.75;
      const domeGeo = new THREE.SphereGeometry(domeR, 32, 24, 0, Math.PI * 2, 0, Math.PI / 1.95);
      const domeMesh = new THREE.Mesh(domeGeo, goldBrightMat);
      domeMesh.position.set(0, domeY, BZ);
      mosque.add(domeMesh);

      // Solid bottom cap inside dome
      const domeCapGeo = new THREE.CircleGeometry(domeR, 32);
      const domeCap = new THREE.Mesh(domeCapGeo, wallMat);
      domeCap.rotation.x = Math.PI / 2;
      domeCap.position.set(0, domeY + 0.01, BZ);
      mosque.add(domeCap);

      const domeSkirt = cyl(domeR + 0.04, domeR + 0.04, 0.1, 24, trimMat);
      domeSkirt.position.set(0, domeY + 0.05, BZ);
      mosque.add(domeSkirt);

      const finialBase = cyl(0.1, 0.1, 0.16, 12, goldMat);
      finialBase.position.set(0, domeY + domeR + 0.08, BZ);
      mosque.add(finialBase);

      const finialSpire = cyl(0.025, 0.055, 0.85, 10, goldMat);
      finialSpire.position.set(0, domeY + domeR + 0.08 + 0.55, BZ);
      mosque.add(finialSpire);

      const crescentGeo = new THREE.TorusGeometry(0.18, 0.03, 12, 24, Math.PI * 1.22);
      const crescent = new THREE.Mesh(crescentGeo, goldBrightMat);
      crescent.position.set(0, domeY + domeR + 1.28, BZ);
      crescent.rotation.z = Math.PI * 0.45;
      mosque.add(crescent);

      const starSphere = sphere(0.045, 8, 8, goldBrightMat);
      starSphere.position.set(0.12, domeY + domeR + 1.4, BZ);
      mosque.add(starSphere);

      // 6. SINGLE MINARET — On the right side from user's view (x = 3.8)
      const mkMinaret = (xOffset) => {
        const mg = new THREE.Group();
        mg.position.set(xOffset, 0, BZ);

        const pedH = 2.0;
        const ped = box(0.9, pedH, 0.9, columnMat);
        ped.position.y = 0.75 + pedH / 2;
        mg.add(ped);

        const tr1 = cyl(0.44, 0.5, 0.2, 12, goldMat);
        tr1.position.y = 0.75 + pedH + 0.1;
        mg.add(tr1);

        const shaftH = 3.5;
        const shaft = cyl(0.3, 0.34, shaftH, 12, wallMat);
        shaft.position.y = 0.75 + pedH + 0.2 + shaftH / 2;
        mg.add(shaft);

        const bal1Y = 0.75 + pedH + 0.2 + shaftH;
        const bal1 = cyl(0.48, 0.48, 0.18, 16, wallMat);
        bal1.position.y = bal1Y + 0.09;
        mg.add(bal1);
        const bal1Ring = cyl(0.54, 0.54, 0.06, 16, goldMat);
        bal1Ring.position.y = bal1Y + 0.18;
        mg.add(bal1Ring);

        const uShaftH = 2.2;
        const uShaft = cyl(0.22, 0.26, uShaftH, 12, wallMat);
        uShaft.position.y = bal1Y + 0.18 + uShaftH / 2;
        mg.add(uShaft);

        const bal2Y = bal1Y + 0.18 + uShaftH;
        const bal2 = cyl(0.36, 0.36, 0.14, 16, wallMat);
        bal2.position.y = bal2Y + 0.07;
        mg.add(bal2);
        const bal2Ring = cyl(0.42, 0.42, 0.05, 16, goldMat);
        bal2Ring.position.y = bal2Y + 0.14;
        mg.add(bal2Ring);

        const tH = 1.2;
        const turret = cyl(0.16, 0.19, tH, 16, wallMat);
        turret.position.y = bal2Y + 0.14 + tH / 2;
        mg.add(turret);

        const mDomeY = bal2Y + 0.14 + tH;
        const mDomeGeo = new THREE.SphereGeometry(0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.9);
        const mDome = new THREE.Mesh(mDomeGeo, goldBrightMat);
        mDome.position.y = mDomeY;
        mg.add(mDome);

        const mDomeCap = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), wallMat);
        mDomeCap.rotation.x = Math.PI / 2;
        mDomeCap.position.y = mDomeY + 0.01;
        mg.add(mDomeCap);

        const mSpire = cyl(0.018, 0.035, 0.55, 8, goldMat);
        mSpire.position.y = mDomeY + 0.28;
        mg.add(mSpire);

        const mCrescGeo = new THREE.TorusGeometry(0.08, 0.012, 6, 16, Math.PI * 1.1);
        const mCresc = new THREE.Mesh(mCrescGeo, goldMat);
        mCresc.position.y = mDomeY + 0.55;
        mCresc.rotation.z = Math.PI * 0.45;
        mg.add(mCresc);

        mosque.add(mg);
      };

      // Only 1 minaret on the right of user (x = 3.8)
      mkMinaret(3.8);

      // 7. FOUNTAIN
      const fountainGroup = new THREE.Group();
      fountainGroup.position.set(0, 0, 5.5);
      mosque.add(fountainGroup);

      const fOuterRimGeo = new THREE.TorusGeometry(1.4, 0.14, 12, 32);
      const fOuterRim = new THREE.Mesh(fOuterRimGeo, trimMat);
      fOuterRim.position.y = 0.2;
      fOuterRim.rotation.x = Math.PI / 2;
      fountainGroup.add(fOuterRim);

      const fBasin = cyl(1.4, 1.45, 0.38, 24, columnMat);
      fBasin.position.y = 0.19;
      fountainGroup.add(fBasin);

      const fWater = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), waterMat);
      fWater.rotation.x = -Math.PI / 2;
      fWater.position.y = 0.36;
      fountainGroup.add(fWater);

      const fCol = cyl(0.1, 0.13, 0.55, 12, columnMat);
      fCol.position.y = 0.65;
      fountainGroup.add(fCol);

      const fJetGeo = new THREE.ConeGeometry(0.1, 0.7, 8);
      const fJetMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
      const fJet = new THREE.Mesh(fJetGeo, fJetMat);
      fJet.position.y = 1.25;
      fountainGroup.add(fJet);

      const fGoldRim = cyl(1.42, 1.42, 0.07, 24, goldMat);
      fGoldRim.position.y = 0.36;
      fountainGroup.add(fGoldRim);

      // 8. GARDEN LAMP POSTS
      const lampPositions = [
        [-1.3, 0, 2.8], [1.3, 0, 2.8],
        [-1.3, 0, 5.2], [1.3, 0, 5.2],
        [-3.5, 0, 3.5], [3.5, 0, 3.5],
      ];

      lampPositions.forEach(([lx, ly, lz]) => {
        const lampGroup = new THREE.Group();
        lampGroup.position.set(lx, ly, lz);

        const pole = cyl(0.04, 0.05, 2.2, 8, lampMat);
        pole.position.y = 1.1;
        lampGroup.add(pole);

        const lampHead = sphere(0.13, 10, 10, lampGlowMat);
        lampHead.position.y = 2.32;
        lampGroup.add(lampHead);

        const lp = new THREE.PointLight(0xffdca0, 0.7, 4.5);
        lp.position.set(lx, 2.32, lz);
        scene.add(lp);

        mosque.add(lampGroup);
      });

      // 9. PALM TREES
      const palmPositions = [
        [-8.2, 0, 1.5], [-8.5, 0, -0.5], [-8.0, 0, -2.0],
        [8.2, 0, 1.5],  [8.5, 0, -0.5],  [8.0, 0, -2.0],
        [-6.0, 0, 5.5], [6.0, 0, 5.5],
        [-7.2, 0, 4.0], [7.2, 0, 4.0],
      ];

      const trunkGeo = new THREE.CylinderGeometry(0.055, 0.1, 2.2, 8);
      const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, palmPositions.length);
      const frondGeo = new THREE.BoxGeometry(1.0, 0.02, 0.2);

      palmPositions.forEach(([px, py, pz], idx) => {
        const m = new THREE.Matrix4();
        const leanX = Math.sin(idx * 2.7) * 0.12;
        const leanY = idx * 1.256;
        const leanZ = Math.cos(idx * 3.1) * 0.09;
        const lean = new THREE.Euler(leanX, leanY, leanZ);
        m.makeRotationFromEuler(lean);
        m.setPosition(px, py + 1.1, pz);
        trunkInst.setMatrixAt(idx, m);

        for (let f = 0; f < 5; f++) {
          const frond = new THREE.Mesh(frondGeo, leafMat);
          frond.position.set(px, py + 2.3, pz);
          frond.rotation.y = (f / 5) * Math.PI * 2 + leanY;
          frond.rotation.z = 0.45;
          mosque.add(frond);
        }
      });

      mosque.add(trunkInst);

      // 10. SKY DOME
      const skyGeo = new THREE.SphereGeometry(85, 12, 12);
      const skyCol1 = new THREE.Color(0xd1613d);
      const skyCol2 = new THREE.Color(0x14386b);

      const colors = [];
      const posAttr = skyGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const y = posAttr.getY(i);
        const t = Math.max(0.0, Math.min(1.0, (y + 10.0) / 90.0));
        const c = skyCol1.clone().lerp(skyCol2, Math.pow(t, 0.75));
        colors.push(c.r, c.g, c.b);
      }
      skyGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

      const skyMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.BackSide,
        depthWrite: false
      });
      const skyDome = new THREE.Mesh(skyGeo, skyMat);
      scene.add(skyDome);

      const sunGeo = new THREE.PlaneGeometry(3.5, 3.5);
      const sunMeshMat = new THREE.MeshBasicMaterial({
        color: 0xffe2a0,
        transparent: true, opacity: 0.8,
        depthWrite: false, blending: THREE.AdditiveBlending
      });
      const sunDisc = new THREE.Mesh(sunGeo, sunMeshMat);
      sunDisc.position.set(30, 38, -50);
      sunDisc.lookAt(0, 0, 0);
      scene.add(sunDisc);

      // 11. DRAG & ZOOM INTERACTION with clamped tilt
      let isDragging = false;
      let prevX = 0;
      let prevY = 0;
      let tiltAngle = 0.06;
      mosque.rotation.x = tiltAngle;

      const onPointerDown = (e) => {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - prevX;
        const deltaY = e.clientY - prevY;

        mosque.rotation.y += deltaX * 0.006;

        tiltAngle += deltaY * 0.003;
        tiltAngle = Math.max(-0.15, Math.min(0.35, tiltAngle));
        mosque.rotation.x = tiltAngle;

        prevX = e.clientX;
        prevY = e.clientY;
      };

      const onPointerUp = () => {
        isDragging = false;
      };

      const onTouchStart = (e) => {
        if (e.touches.length > 0) {
          isDragging = true;
          prevX = e.touches[0].clientX;
          prevY = e.touches[0].clientY;
        }
      };

      const onTouchMove = (e) => {
        if (!isDragging || e.touches.length === 0) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - prevX;
        const deltaY = touch.clientY - prevY;

        mosque.rotation.y += deltaX * 0.006;

        tiltAngle += deltaY * 0.003;
        tiltAngle = Math.max(-0.15, Math.min(0.35, tiltAngle));
        mosque.rotation.x = tiltAngle;

        prevX = touch.clientX;
        prevY = touch.clientY;
      };

      const onTouchEnd = () => {
        isDragging = false;
      };

      const onWheel = (e) => {
        e.preventDefault();
        camera.position.z = Math.max(12.0, Math.min(42.0, camera.position.z + e.deltaY * 0.02));
      };

      const mount = mountRef.current;
      if (mount) {
        mount.addEventListener("mousedown", onPointerDown);
        mount.addEventListener("touchstart", onTouchStart, { passive: true });
        mount.addEventListener("wheel", onWheel, { passive: false });
      }
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("mouseup", onPointerUp);
      window.addEventListener("touchend", onTouchEnd);

      // 12. RESIZE
      const onResize = () => {
        if (!canvasRef.current) return;
        const w = canvasRef.current.clientWidth;
        const h = canvasRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      window.addEventListener("resize", onResize);

      // 13. ANIMATION LOOP
      let raf;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        if (!isDragging) mosque.rotation.y += 0.0018;
        renderer.render(scene, camera);
      };

      animate();

      cleanupFn = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("mouseup", onPointerUp);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        if (mount) {
          mount.removeEventListener("mousedown", onPointerDown);
          mount.removeEventListener("touchstart", onTouchStart);
          mount.removeEventListener("wheel", onWheel);
        }
        renderer.dispose();
      };
    };

    if (!window.THREE) {
      const s = document.createElement("script");
      s.id = "threejs-script";
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      s.async = true;
      s.onload = initThree;
      document.body.appendChild(s);
    } else {
      initThree();
    }

    return () => cleanupFn();
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        flex: 1, position: "relative",
        background: "#0d1a29",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "32px", cursor: "grab", userSelect: "none"
      }}
    >
      {/* Brand header */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", zIndex: 10, position: "relative" }}>
        <img src={formatImageUrl("logo-sm.webp")} alt="Logo" style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid #d9a830" }} />
        <div>
          <h4 style={{ margin: 0, color: "#fff", fontSize: "14px", fontFamily: "Playfair Display, serif", fontWeight: 700 }}>
            Ahlus-Shafa Wal-Wafa
          </h4>
          <span style={{ color: "#d9a830", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>
            Simaya Static Portal
          </span>
        </div>
      </div>

      {/* Clock */}
      <div style={{
        position: "absolute", top: "32px", right: "32px", zIndex: 10,
        background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)", borderRadius: "10px", padding: "10px 16px", textAlign: "right", color: "#fff"
      }}>
        <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "monospace", letterSpacing: "1px" }}>{timeStr}</div>
        <div style={{ fontSize: "9px", color: "#d9a830", marginTop: "2px", fontWeight: 600, letterSpacing: "0.8px" }}>{dateStr}</div>
      </div>

      {/* Canvas */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>

      {/* Footer */}
      <div style={{ zIndex: 10, color: "rgba(255,255,255,0.35)", fontSize: "11px", position: "relative" }}>
        © 2002–{new Date().getFullYear()} Yayasan Pesantren Ahlus-Shafa Wal-Wafa
      </div>
    </div>
  );
}
