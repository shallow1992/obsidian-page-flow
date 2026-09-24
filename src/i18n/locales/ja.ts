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
      desc: "1回のステップでスクロールする画面の高さの割合（推奨: 80-90%）。",
    },
    smoothScroll: {
      name: "スムーズスクロール",
      desc: "ページステップ間を滑らかにアニメーションスクロールします。",
    },
    scrollDuration: {
      name: "スクロールアニメーション時間 (ms)",
      desc: "スムーズスクロールの基本所要時間（ミリ秒、デフォルト: 280ms）。キーを連打すると自動的に加速し、素早く移動できます。",
    },
    sortOrder: {
      name: "ファイルの並び順",
      desc: "フォルダ内の次・前のファイルに移動する際の並び順ルール。",
      options: {
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
  },
  notices: {
    noNextFile: "フォルダ内に次のファイルがありません",
    noPrevFile: "フォルダ内に前のファイルがありません",
  },
};
