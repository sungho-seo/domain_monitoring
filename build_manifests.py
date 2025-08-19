#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os, re, json, argparse
from pathlib import Path

# 파일명 규칙: 20250814_212937__host__403-Forbidden.png
PNG_RE = re.compile(
    r'^(?P<ts>\d{8}_\d{6})__(?P<host>[a-z0-9.-]+)__(?P<status>[A-Z0-9_]+)(?:-(?P<label>[A-Za-z0-9._-]+))?\.png$',
    re.IGNORECASE
)
RUN_DIR_RE = re.compile(r'^\d{8}$')  # 예: 20250814

def build_manifest_for_run(run_dir: Path) -> int:
    """run_dir 안의 PNG 파일을 읽어 manifest.json(Array[str]) 생성. 반환: 파일 수"""
    files = []
    for p in run_dir.glob("*.png"):
        name = p.name
        if PNG_RE.match(name):
            files.append(name)
    # 최신순 정렬(타임스탬프 내림차순)
    files.sort(reverse=True)
    out_path = run_dir / "manifest.json"
    out_path.write_text(json.dumps(files, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(files)

def collect_runs_from_data(data_root: Path, domains) -> list:
    """data/<RUN>/<domain>.csv 존재 여부로 RUN 목록 수집"""
    if not data_root.exists(): return []
    runs = []
    for child in data_root.iterdir():
        if child.is_dir() and RUN_DIR_RE.match(child.name):
            # 세 도메인 중 하나라도 존재하면 run 으로 인정(원하면 all-domains 조건으로 바꿀 수 있음)
            exists_any = any((child / f"{d}.csv").exists() for d in domains)
            if exists_any:
                runs.append(child.name)
    # 최신순(desc)
    runs.sort(reverse=True)
    return runs

def main():
    ap = argparse.ArgumentParser(description="Generate manifest.json per domain/run and runs.json")
    ap.add_argument("--images", default="images", help="images root (default: ./images)")
    ap.add_argument("--data",   default="data",   help="data root (default: ./data)")
    ap.add_argument("--domains", nargs="+", default=["lge.com","lge.co.kr","lgthinq.com"],
                    help="domains to process (space-separated)")
    args = ap.parse_args()

    images_root = Path(args.images).resolve()
    data_root   = Path(args.data).resolve()
    domains     = args.domains

    print(f"[i] images root: {images_root}")
    print(f"[i] data root  : {data_root}")
    print(f"[i] domains    : {', '.join(domains)}")

    # 1) 각 도메인/날짜에 대해 manifest.json 생성
    for d in domains:
        base = images_root / f"img.{d}"
        if not base.exists():
            print(f"[!] skip: {base} (not found)")
            continue
        print(f"[+] domain: {d}")
        count_total = 0
        run_dirs = [p for p in base.iterdir() if p.is_dir() and RUN_DIR_RE.match(p.name)]
        if not run_dirs:
            # 날짜 폴더 없이 바로 PNG가 있는 구조도 지원(구버전 호환)
            made = build_manifest_for_run(base)
            print(f"    - (legacy) {base.name}: {made} files")
            count_total += made
        else:
            for run_dir in sorted(run_dirs):
                made = build_manifest_for_run(run_dir)
                print(f"    - {run_dir.name}: {made} files")
                count_total += made
        print(f"    = total files indexed: {count_total}")

    # 2) data/runs.json 생성
    runs = collect_runs_from_data(data_root, domains)
    runs_json_path = data_root / "runs.json"
    runs_json_path.write_text(json.dumps(runs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[+] wrote {runs_json_path} ({len(runs)} runs)")

if __name__ == "__main__":
    main()
