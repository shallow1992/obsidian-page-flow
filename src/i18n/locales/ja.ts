import { TranslationStrings } from "./en";

export const ja: TranslationStrings = {
  commands: {
    scrollOrNext: "進む: 下にスクロール または 次のファイルへ",
    scrollOrPrev: "戻る: 上にスクロール または 前のファイルへ",
    scrollPageDown: "1ページ下にスクロール",
    scrollPageUp: "1ページ上にスクロール",
    goToNextFile: "フォルダ内の次のファイルへ移動",
    goToPrevFile: "フォルダ内の前のファイルへ移動",
  },
  settings: {
    title: "Page Flow 設定",
    configureHotkeys: {
      name: "ホットキーを設定",
      desc: "Page Flow のコマンドで絞り込まれた Obsidian のホットキー設定を開きます（または 設定 > ホットキー から手動で検索してください）。",
      buttonText: "ホットキーを設定",
    },
    scrollAmount: {
      name: "スクロール量 (%)",
      desc: "1回のステップでスクロールする画面の高さの割合（ページ送り重視なら 80-90%、微調整重視なら 15-30% 推奨）。",
    },
    smoothScroll: {
      name: "スムーズスクロール",
      desc: "ページステップ間を滑らかにアニメーションスクロールします。",
    },
    scrollDuration: {
      name: "スクロールアニメーション時間 (ms)",
      desc: "スムーズスクロールの基本所要時間（ミリ秒、デフォルト: 280ms）。キーを連打すると自動的に加速し、素早く移動できます。",
    },
    maxQueuedScreens: {
      name: "連打時の最大先行キュー (画面数)",
      desc: "連打時に先行できる最大画面数。スクロール量85%なら5画面で約6回分の連打を受け付けます。",
    },
    maxVelocityMultiplier: {
      name: "連打時の最大加速倍率",
      desc: "連打時の最高速度の倍率。数値を上げるほど連続入力で素早く加速します。",
    },
    sortOrder: {
      name: "ファイルの並び順",
      desc: "フォルダ内を移動する順序。「エクスプローラー順」は左サイドバーの並び順に従います。",
      options: {
        fileExplorer: "エクスプローラー順 (推奨)",
        nameAsc: "ファイル名 (昇順: AからZ)",
        nameDesc: "ファイル名 (降順: ZからA)",
        ctimeDesc: "作成日時 (新しい順)",
        ctimeAsc: "作成日時 (古い順)",
        mtimeDesc: "更新日時 (新しい順)",
        mtimeAsc: "更新日時 (古い順)",
      },
    },
    loopFolder: {
      name: "フォルダ内ループ移動",
      desc: "フォルダ内の最後のファイルに達したとき、最初のファイルに戻ってループします。",
    },
    boundaryThreshold: {
      name: "境界到達の判定しきい値 (px)",
      desc: "ノートの最上部または最下部に到達したと判定するためのバッファ（ピクセル）。",
    },
    resetToDefaults: {
      name: "デフォルト値に戻す",
      desc: "すべての設定をインストール時の初期値にリセットします。",
      buttonText: "デフォルトに戻す",
    },
  },
  notices: {
    noNextFile: "フォルダ内に次のファイルがありません",
    noPrevFile: "フォルダ内に前のファイルがありません",
    settingsReset: "設定を初期値にリセットしました",
  },
};
