/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import kaboom from "kaboom";
import { playSound } from "./lib/audio";
import { io, Socket } from "socket.io-client";
import LegalModal from "./components/LegalModal";
import LeaderboardModal from "./components/LeaderboardModal";

const Clock = () => {
    const [currentTime, setCurrentTime] = useState<string>("");
    useEffect(() => {
        const updateTime = () => setCurrentTime(new Date().toLocaleTimeString([], { hour12: false }));
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);
    return <span className="font-bold text-[#ffb77d]">{currentTime || "--:--:--"}</span>;
};

type QuizQuestion = {
  q: string;
  choices: string[];
  correctIdx: number;
  wrongReply: string;
};

type MultiQuestionDialog = {
  name: string;
  itemReward: string;
  completedText: string;
  questions: QuizQuestion[];
  extraDialogue?: { label: string; text: string };
};

const NPC_QUIZ: Record<string, MultiQuestionDialog> = {
  mancing: {
    name: "Area Memancing",
    itemReward: "Ikan Bintoro",
    completedText: "Area memancing yang tenang.",
    questions: []
  },
  kijaga: {
    name: "Ki Jaga",
    itemReward: "Izin Masuk", 
    completedText: "Terima kasih telah membuktikan wawasanmu. Gerbang keraton terbuka untukmu, silahkan masuk ke Kadipaten Bintoro.",
    questions: [
      { q: "Berhenti! Sebutkan maksud kedatanganmu!", choices: ["Ingin Menjelajah", "Buat Rusuh"], correctIdx: 0, wrongReply: "Pergi kau pengacau!" },
      { q: "Buktikan wawasanmu. Siapakah pendiri Kesultanan Demak?", choices: ["Hayam Wuruk", "Raden Patah", "Gajah Mada"], correctIdx: 1, wrongReply: "Salah!" },
      { q: "Demak sebelumnya adalah bawahan dari kerajaan apa?", choices: ["Sunda", "Sriwijaya", "Majapahit"], correctIdx: 2, wrongReply: "Kurang membaca sejarah kau!" },
      { q: "Siapakah Walisongo yang merancang Masjid Agung Demak?", choices: ["Sunan Kalijaga", "Sunan Amangkurat", "P. Diponegoro"], correctIdx: 0, wrongReply: "Ngawur!" },
      { q: "Gelar Raden Patah adalah...", choices: ["Senapati Jimbun", "Raja Mataram", "Sultan Agung"], correctIdx: 0, wrongReply: "Salah nama gelar!" }
    ]
  },
  dalang: {
    name: "Sang Dalang",
    itemReward: "Kayu Jati",
    completedText: "Terima kasih telah menjawab kuisku. Aku sudah menyerahkan Kayu Jati padamu.",
    questions: [
      { q: "Kesenian apa yang diciptakan Sunan Kalijaga menggunakan kulit kerbau?", choices: ["Wayang Golek", "Wayang Kulit", "Ketoprak"], correctIdx: 1, wrongReply: "Kurang tepat, anak muda." },
      { q: "Tembang macapat dakwah Sunan Kalijaga adalah...", choices: ["Lir-ilir", "Gundul Pacul", "Pangkur"], correctIdx: 0, wrongReply: "Bukan itu." },
      { q: "Lakon wayang yang bernuansa Islam tentang syahadat disebut?", choices: ["Mahabharata", "Jamus Kalimasada", "Ramayana"], correctIdx: 1, wrongReply: "Salah." },
      { q: "Alat musik pukul yang digunakan sebagai media dakwah?", choices: ["Gamelan", "Angklung", "Sasando"], correctIdx: 0, wrongReply: "Belum benar." },
      { q: "Tujuan penciptaan wayang kulit adalah...", choices: ["Hiburan semata", "Media dakwah damai", "Alat pertempuran"], correctIdx: 1, wrongReply: "Tentu bukan!" }
    ]
  },
  prajurit: {
    name: "Veteran Malaka",
    itemReward: "Batu Karang",
    completedText: "Terima kasih! Kau pahlawan berwawasan luas! Batu Karang Fondasi sudah diserahkan.",
    extraDialogue: {
      label: "Bagaimana situasi perang?",
      text: "Kami masih terus bersiaga mengatasi armada Portugis di Malaka. Walau Pangeran Sabrang Lor telah tiada, semangat laut Kesultanan Demak tak akan surut dari sanubari kami!"
    },
    questions: [
      { q: "Siapakah julukan panglima kami yang sakti?", choices: ["Pangeran Sabrang Lor", "Ayam Jantan Timur", "Raja Mataram"], correctIdx: 0, wrongReply: "Lupa kau?" },
      { q: "Markas Portugis manakah yang kami serang?", choices: ["Batavia", "Malaka", "Makassar"], correctIdx: 1, wrongReply: "Bukan di situ!" },
      { q: "Siapa nama asli Pangeran Sabrang Lor?", choices: ["Pati Unus", "Trenggana", "Raden Patah"], correctIdx: 0, wrongReply: "Salah nama!" },
      { q: "Senjata tradisional prajurit Jawa?", choices: ["Tombak", "Keris", "Panah"], correctIdx: 1, wrongReply: "Kurang tepat." },
      { q: "Armada laut Demak dikenal kuat. Jenis kapal besar kita adalah?", choices: ["Pinisi", "Jung Jawa", "Galleon"], correctIdx: 1, wrongReply: "Bukan kapal bule!" }
    ]
  },
  syahbandar: {
    name: "Syahbandar",
    itemReward: "Dana Emas",
    completedText: "Terima kasih banyak. Perdagangan lancar! Dana Emas sudah kuberikan untuk modal.",
    questions: [
      { q: "Komoditas utama apa yang diperdagangkan pelabuhan kita?", choices: ["Gading", "Beras & Rempah", "Emas Hitam"], correctIdx: 1, wrongReply: "Bukan itu!" },
      { q: "Pejabat pengatur lalu lintas pelabuhan disebut?", choices: ["Patih", "Adipati", "Syahbandar"], correctIdx: 2, wrongReply: "Salah pangkat!" },
      { q: "Dari mana asal pala dan cengkeh yang sangat mahal?", choices: ["Maluku", "Sumatera", "Sunda"], correctIdx: 0, wrongReply: "Salah pulau!" },
      { q: "Mata uang logam Tiongkok yang dipakai transaksi?", choices: ["Dirham", "Kepeng/Bodon", "Real"], correctIdx: 1, wrongReply: "Itu mata uang asing lain." },
      { q: "Pelabuhan terpenting milik Demak saat itu?", choices: ["Jepara", "Batavia", "Banten"], correctIdx: 0, wrongReply: "Salah letak!" }
    ]
  },
  arsitek: {
    name: "Arsitek Masjid",
    itemReward: "Saka Tatal",
    completedText: "Terima kasih. Luar biasa! Inilah Saka Tatal terakhir kita.",
    questions: [
      { q: "Dikenal sebagai apakah tiang dari dahan sisa/kepingan kayu?", choices: ["Saka Guru", "Saka Tatal", "Mustaka"], correctIdx: 1, wrongReply: "Masa tidak tahu?" },
      { q: "Berapa jumlah Saka Guru di Masjid Agung Demak?", choices: ["2", "4", "8"], correctIdx: 1, wrongReply: "Salah hitung!" },
      { q: "Atap Masjid Demak melambangkan?", choices: ["Iman, Islam, Ihsan", "Langit, Bumi, Neraka", "Tiga Dewa"], correctIdx: 0, wrongReply: "Filosofimu salah!" },
      { q: "Siapa wali yang menyusun kepingan kayu menjadi Saka Tatal?", choices: ["Sunan Kudus", "Sunan Kalijaga", "Sunan Muria"], correctIdx: 1, wrongReply: "Bukan dia arsiteknya!" },
      { q: "Pintu utama masjid berukir disebut apa?", choices: ["Lawang Sewu", "Lawang Bledeg", "Gapura"], correctIdx: 1, wrongReply: "Salah nama pintu!" }
    ]
  },
  kangchill: {
    name: "Kang Chill",
    itemReward: "Es Teh Manis",
    completedText: "Pinggir sungai emang paling bener buat nurunin cortisol bang. Udah, tenang aja.",
    extraDialogue: {
      label: "Mode Low Cortisol",
      text: "TOGGLE_CORTISOL"
    },
    questions: [] // No questions, instant complete
  },
  kakek_rawa: {
    name: "Kakek Rawa",
    itemReward: "Gelang Akar",
    completedText: "Terima kasih anak muda. Lahan basah ini dan gelang akar di tanganmu akan menjadi saksi bahwa kita tidak hanya membangun mahakarya dari batu, tapi juga merawat alam yang menopangnya.",
    questions: [
      { q: "Sstt.. Anak Muda! Rawa-rawa ini dulunya laut terbuka. Masjid yang megah tak akan bertahan jika tanahnya tergerus. Bantu kakek menanam bibit bakau ini demi masa depan pesisir kita.", choices: ["Tanam bibit bakau bersama kakek.", "Maaf kek, saya sibuk..."], correctIdx: 0, wrongReply: "Lahan pesisir akan terus tergerus air laut jika tidak ditanami anak muda..." }
    ]
  }
};

const INVENTORY_DETAILS: Record<string, { icon: string, name: string, desc: string }> = {
    "Kayu Jati": { icon: "🪵", name: "Jati", desc: "Kayu jati pilihan yang ditebang dari hutan keramat Hutan Donoloyo. Seratnya padat dan kuat, diwajibkan sebagai soko guru (tiang penyangga utama) yang melambangkan kekokohan prinsip umat dalam membangun perdaban." },
    "Batu Karang": { icon: "🪨", name: "Batu", desc: "Batu karang keras yang diambil dekat tebing laut pesisir utara, disumbangkan oleh Veteran Malaka. Menjadi lambang benteng maritim pertahanan maritim Kesultanan Demak yang tak tertembus." },
    "Dana Emas": { icon: "🪙", name: "Emas", desc: "Sumbangan pembangunan berupa koin emas dari para saudagar yang melintasi jalur pelabuhan Demak. Melambangkan kemakmuran dan sentralnya posisi ekonomi pesisir Bintoro." },
    "Saka Tatal": { icon: "🏛️", name: "Saka", desc: "Tiang masjid legendaris yang disusun dari serpihan tatal yang diikat berkat kesaktian Sunan Kalijaga. Melambangkan persatuan masyarakat nusantara yang majemuk dalam ikatan nilai Islam." },
    "Izin Masuk": { icon: "📜", name: "Izin", desc: "Surat jalan berstempel Kesultanan yang memberimu akses untuk turut berkontribusi di lingkungan dalam Kadipaten Bintoro. Tanda niat baikmu telah direstui sesepuh kota." },
    "Surya Majapahit": { icon: "🌟", name: "Surya", desc: "Lambang kehormatan keraton bercorak matahari kembar. Merupakan simbol transisi historis perihal bagaimana Kesultanan Demak mewarisi dan melanjutkan tampuk kebesaran Kerajaan Majapahit." },
    "Es Teh Manis": { icon: "🍹", name: "Es Teh", desc: "Minuman penyegar jiwa yang diseduh dari teh pilihan dan gula pelabuhan. Terbukti ampuh meredakan dahaga serta menurunkan kadar cortisol akibat ketegangan peperangan." },
    "Ikan Bintoro": { icon: "🐟", name: "Ikan", desc: "Tangkapan segar dari aliran sungai Bintoro yang membelah kota. Ikan air tawar penyangga gizi masyarakat dan simbol harmoni alam warga daerah pesisir sungai Demak." },
    "Gelang Akar": { icon: "🎋", name: "Gelang", desc: "Anyaman sederhana dari akar mangrove pesisir Morodamak. Merupakan pertanda kepedulian alam menjaga kelestarian sabuk hijau hutan bakau yang melindungi kota dari abrasi pesisir." }
};

const LORE_ENTRIES: Record<string, { title: string, unlockContent: string, lockedContent: string, unlockNpcId: string, source: string }> = {
    kijaga: {
        title: "Wali Songo & Sunan Kalijaga",
        unlockContent: "Sunan Kalijaga adalah salah satu Wali Songo yang berdakwah dengan memadukan ajaran Islam dan budaya lokal Jawa. Beliau dikenal menggunakan pendekatan kesenian, menciptakan karya luar biasa seperti Saka Tatal di Masjid Agung Demak, dan pertunjukan Wayang Kulit berlatar kisah Islami.",
        lockedContent: "Informasi mengenai tokoh ulama besar yang menyebarkan pengaruh Islam di Demak masih misterius. Bicaralah dengan Ki Jaga untuk memahaminya.",
        unlockNpcId: "kijaga",
        source: "Babad Tanah Jawi; Buku 'Wali Songo: Rekonstruksi Sejarah yang Disingkirkan' oleh Agus Sunyoto."
    },
    prajurit: {
        title: "Perjuangan Bintoro di Malaka",
        unlockContent: "Kesultanan Demak bukan sekadar pusat agama, tapi juga kerajaan maritim yang tangguh. Pati Unus (Pangeran Sabrang Lor) pernah memimpin armada besar Demak untuk menyerang pertahanan Portugis di Malaka, demi melindungi jalur perdagangan rempah-rempah Nusantara.",
        lockedContent: "Masa lalu pertempuran pesisir Demak melawan penjajah belum terungkap. Tanyakan pada Veteran yang berada di perkemahan.",
        unlockNpcId: "prajurit",
        source: "Suma Oriental karya Tomé Pires; Catatan Sejarah Kerajaan Islam di Jawa."
    },
    arsitek: {
        title: "Masjid Agung Demak",
        unlockContent: "Masjid Agung Demak merupakan salah satu masjid tertua di Indonesia, dibangun oleh Raden Patah bersama Wali Songo. Desain atap meTajuk berbentuk limas menjadi ciri khas perpaduan gaya arsitektur tradisional Nusantara dengan nilai-nilai Islami.",
        lockedContent: "Blueprint mengenai bangunan suci di pusat Kadipaten Bintoro belum ditemukan. Bantu Arsitek Masjid untuk memahaminya.",
        unlockNpcId: "arsitek",
        source: "'Sejarah Kebudayaan Islam Nusantara' - Kemenag RI; Babad Demak."
    },
    dalang: {
        title: "Wayang Sebagai Media Dakwah",
        unlockContent: "Wali Songo tidak menghapuskan tradisi, melainkan menyempurnakannya. Wayang Kulit, yang sebelumnya menceritakan epik Hindu, dimodifikasi bentuknya untuk menyesuaikan dengan akidah, sembari menyisipkan pesan-pesan tasawuf dan moral Islami (seperti Jamus Kalimasada menjadi Kalimat Syahadat).",
        lockedContent: "Kesenian lokal menyimpan rahasia dakwah yang mendalam. Carilah Sang Dalang untuk membuka arsip sejarah ini.",
        unlockNpcId: "dalang",
        source: "'Wayang dan Dakwah Islam' dalam Jurnal Sejarah Nusantara."
    },
    syahbandar: {
        title: "Jalur Sutra & Maritim Demak",
        unlockContent: "Pelabuhan Demak adalah titik strategis di Jalur Rempah Nusantara. Berbagai saudagar dari Arab, Gujarat, dan Tiongkok berlabuh di sini. Syahbandar memegang peran penting mengatur bea cukai, menyalurkan upeti, serta menjaga keamanan pesisir.",
        lockedContent: "Perdagangan internasional di pesisir utara Jawa masih tertutup kabut. Temui Syahbandar untuk membuka wawasan ini.",
        unlockNpcId: "syahbandar",
        source: "'Jaringan Perdagangan dan Pelayaran Nusantara' oleh A.B. Lapian."
    }
};

const getAssetUrl = (name: string) => {
    const svgs: Record<string, string> = {
        "rumput": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#2d5a27"/><path d="M 20 40 L 25 30 L 30 40 M 40 20 L 45 10 L 50 20" stroke="#3d7a37" stroke-width="2" fill="none"/></svg>`,
        "jalan": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#8b5a2b"/><circle cx="20" cy="20" r="2" fill="#6b4423"/><circle cx="45" cy="40" r="3" fill="#6b4423"/></svg>`,
        "air": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#1e90ff"/><path d="M 0 30 Q 16 20 32 30 T 64 30" stroke="#87cefa" stroke-width="2" fill="none"/></svg>`,
        "pohon": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#2d5a27"/><rect x="24" y="32" width="16" height="32" fill="#5c4033"/><circle cx="32" cy="24" r="24" fill="#006400"/></svg>`,
        "joglo": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#2d5a27"/><rect x="8" y="32" width="48" height="32" fill="#d2b48c"/><polygon points="32,8 4,32 60,32" fill="#8b4513"/></svg>`,
        "jembatan": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#1e90ff"/><rect x="0" y="24" width="64" height="16" fill="#a0522d"/><line x1="0" y1="28" x2="64" y2="28" stroke="#8b4513" stroke-width="2"/><line x1="0" y1="36" x2="64" y2="36" stroke="#8b4513" stroke-width="2"/></svg>`,
        "kijaga": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="24" r="16" fill="#ffdab9"/><rect x="20" y="40" width="24" height="24" fill="#800000"/><path d="M 16 8 Q 32 -8 48 8 L 40 16 L 24 16 Z" fill="#000000"/></svg>`,
        "prajurit": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="24" r="16" fill="#ffdab9"/><rect x="20" y="40" width="24" height="24" fill="#4b5320"/><rect x="24" y="8" width="16" height="16" fill="#708090"/></svg>`,
        "arsitek": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="24" r="16" fill="#ffdab9"/><rect x="20" y="40" width="24" height="24" fill="#b8860b"/><rect x="20" y="16" width="24" height="8" fill="#ffffff"/></svg>`,
        "dalang": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="24" r="16" fill="#ffdab9"/><rect x="20" y="40" width="24" height="24" fill="#483d8b"/><path d="M 32 40 L 48 24 L 32 8 Z" fill="#ffd700"/></svg>`,
        "syahbandar": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="24" r="16" fill="#ffdab9"/><rect x="20" y="40" width="24" height="24" fill="#008080"/><circle cx="32" cy="24" r="20" fill="none" stroke="#ffd700" stroke-width="4"/></svg>`,
        "surya": `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><g transform="translate(32,32)"><polygon points="0,-28 6,-10 28,0 6,10 0,28 -6,10 -28,0 -6,-10" fill="#ffd700" /><polygon points="0,-20 5,-7 20,0 5,7 0,20 -5,7 -20,0 -5,-7" fill="#ffa500" transform="rotate(45)" /><circle cx="0" cy="0" r="10" fill="#ff8c00" /><circle cx="0" cy="0" r="5" fill="#ffd700" /></g></svg>`
    };
    return `data:image/svg+xml;base64,${btoa(svgs[name])}`;
};

const getEmojiUrl = (emoji: string) => {
    const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="55%" dominant-baseline="central" text-anchor="middle" font-size="48">${emoji}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-900 text-white p-8">
          <h1 className="text-3xl font-bold border-b-2 border-white pb-2 mb-4">Aplikasi Mengalami Kesalahan / Crash</h1>
          <p className="text-lg mb-2 font-mono">{this.state.error?.toString()}</p>
          <p className="text-sm text-red-200">Silakan muat ulang halaman. Hubungi developer jika ini terus terjadi.</p>
          <pre className="text-xs text-red-300 mt-4 overflow-auto max-w-full p-4 bg-black/30 rounded">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const [appState, setAppState] = useState<"loading" | "intro" | "setup" | "game" | "open_world" | "victory">("intro");
  const [transitionState, setTransitionState] = useState<"idle" | "fading_out" | "fading_in">("idle");

  const getPlayerLevelText = (inv: string[], npcs: string[]) => {
      if (inv.includes("Surya Majapahit")) return "Level 5: Penjaga Peradaban";
      if (npcs.includes("arsitek")) return "Level 4: Utusan Arsitek";
      if (npcs.includes("syahbandar")) return "Level 3: Kepercayaan Saudagar Kaya";
      if (npcs.includes("dalang")) return "Level 2: Pencari Jejak";
      if (npcs.includes("prajurit")) return "Level 1: Pengembara Bintoro";
      if (npcs.includes("kijaga")) return "Level 0: Pendatang Asing";
      return "Pendatang Baru";
  };

  const getPlayerLevelColor = (inv: string[], npcs: string[]) => {
      if (inv.includes("Surya Majapahit")) return "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]";
      if (npcs.includes("arsitek")) return "text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.8)]";
      if (npcs.includes("syahbandar")) return "text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]";
      if (npcs.includes("dalang")) return "text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.8)]";
      if (npcs.includes("prajurit")) return "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]";
      if (npcs.includes("kijaga")) return "text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.8)]";
      return "text-slate-500";
  };

  const changeAppState = (newState: typeof appState) => {
      if (socketRef.current) {
          socketRef.current.emit("join", {
             name: playerName,
             avatar: playerAvatar,
             appState: newState,
             inventory: inventoryRef.current,
             completedNpcs: completedNpcsRef.current,
             x: 0,
             y: 0
          });
      }
      setTransitionState("fading_out");
      setTimeout(() => {
          setAppState(newState);
          setTransitionState("fading_in");
          setTimeout(() => {
              setTransitionState("idle");
          }, 600);
      }, 600); // length of fade out
  };

  const [playerName, setPlayerName] = useState("");
  const [playerNameError, setPlayerNameError] = useState("");
  const [playerAvatar, setPlayerAvatar] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const floatingTagsRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    playSound.click();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const [showAchievement, setShowAchievement] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lowGraphics, setLowGraphics] = useState(() => {
    return localStorage.getItem("bintoro_low_graphics") === "true";
  });
  const [playTimeSeconds, setPlayTimeSeconds] = useState(0);

  // Sync playTimeSeconds to a ref to avoid stale closure issues in setInterval
  const playTimeSecondsRef = useRef(playTimeSeconds);
  useEffect(() => { playTimeSecondsRef.current = playTimeSeconds; }, [playTimeSeconds]);

  useEffect(() => {
    let timerId: any;
    if (appState === "open_world") {
       timerId = setInterval(() => {
          setPlayTimeSeconds((prev) => prev + 1);
       }, 1000);
    }
    return () => clearInterval(timerId);
  }, [appState]);

  const [volume, setVolume] = useState(100);

  useEffect(() => {
    localStorage.setItem("bintoro_low_graphics", String(lowGraphics));
  }, [lowGraphics]);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showFullInventory, setShowFullInventory] = useState(false);
  const [networkPing, setNetworkPing] = useState(42);

  useEffect(() => {
     const interval = setInterval(() => {
        setNetworkPing(prev => {
            const fluctuation = Math.floor(Math.random() * 11) - 5; 
            let newPing = prev + fluctuation;
            if (newPing < 15) newPing = 15;
            if (newPing > 120) newPing = 120;
            return newPing;
        });
     }, 2000);
     return () => clearInterval(interval);
  }, []);

  // Brings an item to the front of the quick inventory slots
  const equipItemToQuickSlot = (itemName: string) => {
      playSound.click();
      const newInv = [...inventory.filter(i => i !== itemName), itemName];
      setInventory(newInv);
      syncStateToFirebase({ inventory: newInv });
  };
  const [showMap, setShowMap] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [showFishing, setShowFishing] = useState(false);
  const [showFishingTutorial, setShowFishingTutorial] = useState(false);
  const [showQuestTracker, setShowQuestTracker] = useState(true);
  const [fishingState, setFishingState] = useState<"idle" | "waiting" | "catching" | "success" | "fail">("idle");
  const [fishProgress, setFishProgress] = useState(50);
  const [fishHoldTime, setFishHoldTime] = useState(0); 
  const [fishCooldown, setFishCooldown] = useState(false);

  useEffect(() => {
     let interval: any;
     if (fishingState === "catching") {
        interval = setInterval(() => {
           setFishProgress(p => {
              const newP = Math.max(0, p - 6);
              if (newP <= 0) {
                 playSound.click();
                 setFishingState("fail");
                 setFishHoldTime(0);
                 setFishCooldown(true);
                 setTimeout(() => setFishCooldown(false), 2000);
                 return 0;
              }
              
              setFishHoldTime(ht => {
                  if (newP >= 90) { // Safe zone is 90 to 100
                      const nextHt = ht + (newP >= 95 ? 2 : 1);
                      if (nextHt >= 30) { // 30 ticks * 333ms = ~10 seconds
                          playSound.victory();
                          setFishingState("success");
                          return 30;
                      }
                      return nextHt;
                  } else {
                      return Math.max(0, ht - 1);
                  }
              });

              return newP;
           });
        }, 333);
     }
     return () => clearInterval(interval);
  }, [fishingState]);
  const [selectedMapNpc, setSelectedMapNpc] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [playerGridPos, setPlayerGridPos] = useState({x: 24, y: 26});

  const [showChat, setShowChat] = useState(false);
  const [completedDialogView, setCompletedDialogView] = useState<"options" | "whats_new" | "progress" | "extra">("options");
  const [isWasted, setIsWasted] = useState(false);
  const [isNearNpc, setIsNearNpc] = useState(false);

  const [activeNpcId, setActiveNpcId] = useState("kijaga");
  const [activeNpcName, setActiveNpcName] = useState("Ki Jaga");

  const [inventory, setInventory] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [recentReward, setRecentReward] = useState<{ npcName: string, itemReward: string } | null>(null);
  const [completedNpcs, setCompletedNpcs] = useState<string[]>([]);

  useEffect(() => {
     if (socketRef.current) {
         socketRef.current.emit("updateState", {
             inventory: inventory,
             completedNpcs: completedNpcs,
             selectedEquipment: selectedEquipment
         });
     }
  }, [inventory, completedNpcs, selectedEquipment]);
  const [showAvatarConfirm, setShowAvatarConfirm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const showTutorialRef = useRef(false);
  useEffect(() => { showTutorialRef.current = showTutorial; }, [showTutorial]);
  const [timer, setTimer] = useState(30);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const TUTORIAL_STEPS = [
    {
       title: "Pergerakan",
       desc: "Gunakan tombol virtual di layar (D-PAD/Joystick) atau tombol W, A, S, D pada keyboard untuk menggerakan karaktermu di dunia Bintoro.",
       icon: "directions_run"
    },
    {
       title: "Interaksi Objek",
       desc: "Hampiri karakter (NPC) atau benda, lalu tekan tombol Aksi yang muncul di layar (atau Spacebar di keyboard) untuk berinteraksi dan mengikuti kuis.",
       icon: "touch_app"
    },
    {
       title: "Misi Utama",
       desc: "Kamu sedang dalam misi mengumpulkan bahan untuk membangun Masjid Agung Demak. Buka menu Misi di kiri layar untuk memandu perjalananmu.",
       icon: "explore"
    },
    {
       title: "Inventori",
       desc: "Setiap barang yang didapat akan masuk ke Inventori di bawah layar. Klik barang tersebut jika ingin memegangnya, atau klik tas di menu kiri untuk membaca detailnya.",
       icon: "work"
    },
    {
       title: "Siap Bertualang!",
       desc: "Selesaikan misi sejarah yang seru ini, jawab tantangannya, dan jangan menyerah!",
       icon: "celebration"
    }
  ];

  const QUESTS = [
    { 
      id: "kijaga", 
      title: "Minta Izin Masuk", 
      desc: "Temui Ki Jaga di gerbang untuk mendapatkan Izin Masuk.", 
      npc: "Ki Jaga", 
      completed: completedNpcs.includes("kijaga") || appState === "open_world" || appState === "victory" 
    },
    { 
      id: "dalang", 
      title: "Material: Kayu Jati", 
      desc: "Jawab kuis dari Sang Dalang untuk mendapatkan Kayu Jati Pilihan.", 
      npc: "Sang Dalang", 
      completed: completedNpcs.includes("dalang") 
    },
    { 
      id: "prajurit", 
      title: "Material: Batu Karang", 
      desc: "Temui Veteran Malaka dan ceritakan sejarah lautan kita.", 
      npc: "Veteran Malaka", 
      completed: completedNpcs.includes("prajurit") 
    },
    { 
      id: "syahbandar", 
      title: "Material: Dana Emas", 
      desc: "Temui Syahbandar di timur untuk mendapatkan Dana Emas.", 
      npc: "Syahbandar", 
      completed: completedNpcs.includes("syahbandar") 
    },
    { 
      id: "arsitek", 
      title: "Temui sang Arsitek", 
      desc: "Bantu sang Arsitek membangun Masjid Agung Demak jika 4 bahan lengkap.", 
      npc: "Arsitek Masjid", 
      completed: completedNpcs.includes("arsitek") || appState === "victory" 
    }
  ];

  const currentQuestTemp = QUESTS.find(q => !q.completed) || QUESTS[QUESTS.length - 1];
  const isAllQuestsCompleted = inventory.includes("Surya Majapahit");
  const currentQuest = isAllQuestsCompleted ? {
    id: "selesai",
    title: "SELESAI",
    desc: "Terimakasih telah membangun Masjid Agung Demak! Perjuanganmu kini telah tercatat dalam sejarah.",
    npc: "Semua",
    completed: true
  } : currentQuestTemp;
  const [lastQuestId, setLastQuestId] = useState(currentQuest.id);

  useEffect(() => {
     if (currentQuest.id !== lastQuestId) {
         setLastQuestId(currentQuest.id);
         setShowQuestTracker(true);
     }
  }, [currentQuest.id, lastQuestId]);

  const moveState = useRef({ up: false, down: false, left: false, right: false });
  
  const kRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const remotePlayersRef = useRef<Record<string, any>>({});

  // Refs for tracking states inside Kaboom block
  const isNearNpcRef = useRef(false);
  const isWastedRef = useRef(false);
  const showChatRef = useRef(false);
  const isPausedRef = useRef(false);
  const showQuestLogRef = useRef(false);
  const showFullInventoryRef = useRef(false);
  const showLoreRef = useRef(false);
  const showFishingRef = useRef(false);
  const showAchievementRef = useRef(false);
  const appStateRef = useRef(appState);
  const inventoryRef = useRef(inventory);
  const selectedEquipmentRef = useRef(selectedEquipment);
  const completedNpcsRef = useRef(completedNpcs);
  const lowGraphicsRef = useRef(lowGraphics);

  useEffect(() => { lowGraphicsRef.current = lowGraphics; }, [lowGraphics]);
  useEffect(() => { isWastedRef.current = isWasted; }, [isWasted]);
  useEffect(() => { showChatRef.current = showChat; }, [showChat]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { showQuestLogRef.current = showQuestLog; }, [showQuestLog]);
  useEffect(() => { showFullInventoryRef.current = showFullInventory; }, [showFullInventory]);
  useEffect(() => { showLoreRef.current = showLore; }, [showLore]);
  useEffect(() => { showFishingRef.current = showFishing; }, [showFishing]);
  useEffect(() => { showAchievementRef.current = showAchievement; }, [showAchievement]);
  useEffect(() => { selectedEquipmentRef.current = selectedEquipment; }, [selectedEquipment]);
  useEffect(() => { completedNpcsRef.current = completedNpcs; }, [completedNpcs]);
  useEffect(() => { 
    appStateRef.current = appState; 
    if (appState === "open_world") {
        playSound.playBGM();
        playSound.playAmbient();
    } else {
        playSound.stopBGM();
        playSound.stopAmbient();
    }
  }, [appState]);
  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  
  const playerAvatarRef = useRef(playerAvatar);
  useEffect(() => {
     if (kRef.current && playerAvatar && playerAvatarRef.current !== playerAvatar) {
         try {
             kRef.current.loadSprite("playerAsset", playerAvatar);
         } catch(e) {}
     }
     playerAvatarRef.current = playerAvatar;
  }, [playerAvatar]);

  useEffect(() => {
    if (kRef.current) {
      kRef.current.volume(volume / 100);
    }
  }, [volume]);

  // Handle Timer for Quiz
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showChat && !completedNpcs.includes(activeNpcId) && !isWasted) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
             setIsWasted(true);
             playSound.fail();
             setShowChat(false);
             setCurrentQuestionIndex(0);
             return 0;
          }
          return prev - 1;
        })
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showChat, activeNpcId, completedNpcs, isWasted]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showQuestLogRef.current) {
          playSound.click();
          setShowQuestLog(false);
        } else if (showFullInventoryRef.current) {
          playSound.click();
          setShowFullInventory(false);
        } else if (showLoreRef.current) {
          playSound.click();
          setShowLore(false);
        } else if (showAchievementRef.current) {
          playSound.click();
          setShowAchievement(false);
        } else if (isPausedRef.current) {
          playSound.click();
          setIsPaused(false);
        } else if (showChatRef.current) {
          playSound.click();
          setShowChat(false);
          setCurrentQuestionIndex(0);
          setCompletedDialogView("options");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Firebase Auth
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Sync play time to firebase periodically
  useEffect(() => {
    let syncTimer: any;
    if (appState === "open_world" && currentUser) {
        syncTimer = setInterval(() => {
            syncStateToFirebase({ playTimeSeconds: playTimeSecondsRef.current });
        }, 30000); // Sync every 30 seconds
    }
    return () => clearInterval(syncTimer);
  }, [appState, currentUser]);

  useEffect(() => {
    import('./lib/firebase').then(({ auth, db }) => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          setCurrentUser(user);
          const { doc, getDoc } = await import('firebase/firestore');
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPlayerName(data.name);
            setPlayerAvatar(data.avatar);
            setInventory(data.inventory || []);
            setCompletedNpcs(data.completedNpcs || []);
            setPlayTimeSeconds(data.playTimeSeconds || 0);
            if (data.selectedEquipment !== undefined) {
                 if (typeof data.selectedEquipment === 'number' && data.inventory) {
                      setSelectedEquipment(data.inventory[data.selectedEquipment] || null);
                 } else {
                      setSelectedEquipment(data.selectedEquipment);
                 }
            }
            if (!data.hasSeenTutorial) {
                setShowTutorial(true);
            }
            changeAppState(data.appState || "game");
          } else {
            changeAppState("setup");
          }
        } else {
          setCurrentUser(null);
          changeAppState("intro");
        }
        setAuthChecking(false);
      });
    });
  }, []);

  const handleAuth = async () => {
    playSound.click();
    const { signInWithGoogle, signInWithGoogleRedirect } = await import('./lib/firebase');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      console.error("Login detail:", e);
      if (e?.code === 'auth/unauthorized-domain') {
          setAuthChecking(false);
          alert("Domain ini belum diizinkan di Firebase. Buka console.firebase.google.com -> Authentication -> Settings -> Authorized Domains -> Tambahkan domain ini ke daftar.");
      } else if (e?.code === 'auth/popup-closed-by-user' || e?.message?.includes('popup')) {
          setAuthChecking(false);
          const wantRedirect = window.confirm("Popup login diblokir. Apakah Anda ingin mencoba menggunakan metode Redirect?");
          if (wantRedirect) {
              await signInWithGoogleRedirect();
          } else {
             const wantNewTab = window.confirm("Silakan klik ikon 'Open in new tab' (↗️) di pojok kanan atas layar preview untuk login di tab baru.");
             if (wantNewTab) {
                 window.open(window.location.href, '_blank');
             }
          }
      } else {
          alert("Error login: " + (e?.message || String(e)));
      }
    }
  };

  const syncStateToFirebase = async (updates: any) => {
    if (!currentUser) return;
    const { db, handleFirestoreError, OperationType } = await import('./lib/firebase');
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "users/" + currentUser.uid);
    }
  };

  useEffect(() => {
    if (currentUser && appState !== "intro" && appState !== "setup") {
        syncStateToFirebase({
            name: playerName,
            avatar: playerAvatar,
            inventory: inventory,
            completedNpcs: completedNpcs,
            appState: appState,
            selectedEquipment: selectedEquipment
        });
    }
  }, [inventory, completedNpcs, appState, playerAvatar, playerName, selectedEquipment]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");
        if (ctx) {
          tempCanvas.width = 32; tempCanvas.height = 32;
          ctx.drawImage(img, 0, 0, 32, 32);
          setPlayerAvatar(tempCanvas.toDataURL("image/png"));
        }
      };
      if (typeof event.target?.result === "string") img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const masukGame = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound.click();
    
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch(e) {}
    
    // Add validation
    const trimmedName = playerName.trim();
    if (trimmedName.length < 3 || trimmedName.length > 15) {
      setPlayerNameError("Nama harus terdiri dari 3 hingga 15 karakter.");
      return;
    }
    
    const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(trimmedName);
    if (!isAlphanumeric) {
      setPlayerNameError("Nama hanya boleh mengandung huruf dan angka tanpa spasi.");
      return;
    }
    
    setPlayerNameError("");
    
    if (!trimmedName || !playerAvatar || !currentUser) return;
    
    // Check if profile exists
    const { db, handleFirestoreError, OperationType } = await import('./lib/firebase');
    const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
    try {
      const docSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (docSnap.exists()) {
         await syncStateToFirebase({
            name: playerName,
            avatar: playerAvatar
         });
         const data = docSnap.data();
         changeAppState(data.appState || "game");
      } else {
        await setDoc(doc(db, "users", currentUser.uid), {
          userId: currentUser.uid,
          name: playerName,
          avatar: playerAvatar,
          appState: "game",
          inventory: [],
          completedNpcs: [],
          hasSeenTutorial: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setShowTutorial(true);
        changeAppState("game");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "users/" + currentUser.uid);
    }
  };

  const openAction = () => {
    if (!isNearNpcRef.current) return;
    playSound.action();

    if (activeNpcId === "arsitek" && inventoryRef.current.filter((i: string) => ["Batu Karang", "Kayu Jati", "Saka Tatal", "Dana Emas"].includes(i)).length >= 4) {
       // VICTORY CONDITION
       playSound.victory();
       changeAppState("victory");
       
       if (!inventoryRef.current.includes("Surya Majapahit")) {
           const newInv = [...inventoryRef.current, "Surya Majapahit"];
           const newCompleted = Array.from(new Set([...completedNpcs, "arsitek"]));
           setInventory(newInv);
           setCompletedNpcs(newCompleted);
           syncStateToFirebase({ appState: "victory", inventory: newInv, completedNpcs: newCompleted });
       } else {
           syncStateToFirebase({ appState: "victory" });
       }
       return;
    }

    if (activeNpcId === "mancing") {
        setShowFishing(true);
        setFishingState("idle");
        // Show tutorial automatically if never completed manually
        if (!completedNpcs.includes("mancing_tutorial")) {
            setShowFishingTutorial(true);
            const newCompleted = [...completedNpcs, "mancing_tutorial"];
            setCompletedNpcs(newCompleted);
            syncStateToFirebase({ completedNpcs: newCompleted });
        }
        return;
    }

    if (activeNpcId === "kangchill") {
        setShowChat(true);
        if (!completedNpcs.includes("kangchill")) {
            const reward = NPC_QUIZ.kangchill.itemReward;
            setRecentReward({ npcName: "Kang Chill", itemReward: reward });
            const newInv = inventoryRef.current.includes(reward) ? inventoryRef.current : [...inventoryRef.current, reward];
            const newCompleted = [...completedNpcs, "kangchill"];
            
            setInventory(newInv);
            setCompletedNpcs(newCompleted);
            syncStateToFirebase({ inventory: newInv, completedNpcs: newCompleted });
            setTimeout(() => setRecentReward(null), 5000);
        }
        return;
    }

    setShowChat(true);
    setTimer(30);
  };

  const handlePilihJawaban = (idx: number, isCorrect: boolean) => {
    if (isCorrect) {
      const activeNpcQuestions = NPC_QUIZ[activeNpcId].questions;
      if (currentQuestionIndex === activeNpcQuestions.length - 1) { // Completed last question
        playSound.victory();
        const reward = NPC_QUIZ[activeNpcId].itemReward;
        let newInventory = inventory;
        if (reward !== "Izin Masuk" && !inventory.includes(reward)) {
           newInventory = [...inventory, reward];
        }
        const newCompleted = [...completedNpcs, activeNpcId];
        
        setInventory(newInventory);
        setCompletedNpcs(newCompleted);
        
        syncStateToFirebase({
            inventory: newInventory,
            completedNpcs: newCompleted
        });
        
        setRecentReward({ npcName: NPC_QUIZ[activeNpcId].name, itemReward: reward });
        setTimeout(() => setRecentReward(null), 5000);
        
        // Spawn particle visual cue in Kaboom world
        if (kRef.current) {
           const k = kRef.current;
           const npcs = k.get("npc");
           const activeNpc = npcs.find((n: any) => n.npcId === activeNpcId);
           if (activeNpc) {
              const originX = activeNpc.pos.x;
              const originY = activeNpc.pos.y - 100;
              
              // Emit golden sparkles
              for (let i = 0; i < 30; i++) {
                 k.add([
                    k.rect(8, 8),
                    k.pos(originX, originY),
                    k.color(255, 215, 0),
                    k.move(k.choose([k.UP, k.DOWN, k.LEFT, k.RIGHT, k.vec2(1,1), k.vec2(-1,-1), k.vec2(1,-1), k.vec2(-1,1)]), k.rand(100, 300)),
                    k.scale(k.rand(0.5, 1.5)),
                    k.opacity(1),
                    k.lifespan(2, { fade: 0.5 }),
                    k.z(9999),
                    "sparkle"
                 ]);
              }

              // Emit a floating "+ Reward" text
              k.add([
                 k.text(`+ ${reward}`, { size: 24, font: "apl386" }),
                 k.pos(originX, originY - 100),
                 k.color(255, 215, 0),
                 k.move(k.UP, 100),
                 k.opacity(1),
                 k.lifespan(3, { fade: 1 }),
                 k.anchor("center"),
                 k.z(9999)
              ]);
           }
        }

        // Show success dialog but DON'T dismiss
        // User clicks "Tutup" to dismiss.
        // If it's kijaga, they click "Tutup" to enter open world.
      } else {
        playSound.success();
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimer(30);
      }
    } else {
      playSound.fail();
      setIsWasted(true);
      setCurrentQuestionIndex(0);
      setShowChat(false);
    }
  };

  const closeChatDialog = () => {
      playSound.click();
      setShowChat(false);
      setCurrentQuestionIndex(0);
      setCompletedDialogView("options");
      if (activeNpcId === "kijaga" && appState === "game") {
          changeAppState("open_world");
          syncStateToFirebase({ appState: "open_world" });
      }
  };

  // ==========================================
  // LOGIKA ENGINE KABOOM (TILESET ASSETS)
  const isKaboomRunning = appState === "game" || appState === "open_world";
  // ==========================================
  useEffect(() => {
    if (!isKaboomRunning || !canvasRef.current || !playerAvatar) return;
    if (kRef.current) return; // already initialized

    if (!socketRef.current) {
       const socket = io();
       socketRef.current = socket;
       
       socket.on("connect", () => {
         socket.emit("join", {
           name: playerName,
           avatar: playerAvatar,
           appState,
           inventory: inventoryRef.current,
           completedNpcs: completedNpcsRef.current,
           x: 0,
           y: 0
         });
       });

       socket.on("currentPlayers", (players) => {
         players.forEach((p: any) => {
           if (p.id !== socket.id) {
             remotePlayersRef.current[p.id] = p;
             if (p.avatar && kRef.current) {
                try {
                  const k = kRef.current;
                  k.loadSprite(`avatar_${p.id}`, p.avatar);
                } catch(e) {}
             }
           }
         });
       });

       socket.on("playerJoined", (p) => {
         if (p.id !== socket.id) {
           remotePlayersRef.current[p.id] = p;
           if (p.avatar && kRef.current) {
              try {
                const k = kRef.current;
                k.loadSprite(`avatar_${p.id}`, p.avatar);
              } catch(e) {}
           }
         }
       });

       socket.on("playerUpdated", (data) => {
         if (remotePlayersRef.current[data.id]) {
           if (data.inventory !== undefined) remotePlayersRef.current[data.id].inventory = data.inventory;
           if (data.completedNpcs !== undefined) remotePlayersRef.current[data.id].completedNpcs = data.completedNpcs;
           if (data.appState !== undefined) remotePlayersRef.current[data.id].appState = data.appState;
           if (data.selectedEquipment !== undefined) remotePlayersRef.current[data.id].selectedEquipment = data.selectedEquipment;
         }
       });

       socket.on("playerMoved", (data) => {
          if (remotePlayersRef.current[data.id]) {
            remotePlayersRef.current[data.id].x = data.x;
            remotePlayersRef.current[data.id].y = data.y;
          }
       });

       socket.on("playerLeft", (id) => {
          delete remotePlayersRef.current[id];
          if (kRef.current) {
             const k = kRef.current;
             const players = k.get(`remote_${id}`);
             players.forEach((p: any) => k.destroy(p));
          }
       });
    }

    // Let Kaboom natively handle its sizing without constraints
    const k = kaboom({
      global: false,
      canvas: canvasRef.current,
      width: 1280,
      height: 720,
      stretch: true,
      letterbox: true,
      background: [20, 20, 20],
      pixelDensity: lowGraphics ? 1 : (window.devicePixelRatio > 1 ? 1.5 : 1),
      crisp: true,
      maxFPS: 60,
    });
    kRef.current = k;

    k.loadSprite("playerAsset", playerAvatar);
    k.loadSprite("surya", getAssetUrl("surya"));
    k.loadSprite("medal", "/assets/medal-lowcortisol.jpg");
    k.loadSprite("tikar_santai", "/assets/tikar-santai.jpg");
    k.loadSprite("kangchill", "/assets/kang-chill.png");
    k.loadSprite("kijaga", "/kijaga.png");
    k.loadSprite("dalang", "/dalang.png");
    k.loadSprite("prajurit", "/prajurit.png");
    k.loadSprite("arsitek", "/arsitek.png");
    k.loadSprite("syahbandar", "/syahbandar.png");
    k.loadSprite("kangchill", "/assets/kang-chill.png");
    k.loadSprite("kakek_rawa", getEmojiUrl("👴"));
    k.loadSprite("bibit_bakau", getEmojiUrl("🌱"));
    Object.entries(INVENTORY_DETAILS).forEach(([key, val]) => {
        k.loadSprite("item_" + key, getEmojiUrl(val.icon));
    });
    
    k.loadSprite("rumput", getAssetUrl("rumput"));
    k.loadSprite("jalan", getAssetUrl("jalan"));
    k.loadSprite("air", getAssetUrl("air"));
    k.loadSprite("pohon", getAssetUrl("pohon"));
    k.loadSprite("joglo", getAssetUrl("joglo"));
    k.loadSprite("jembatan", getAssetUrl("jembatan"));

    const addDropShadow = (characterObject: any, yOffset = 16) => {
        if (lowGraphicsRef.current) return;
        characterObject.add([
            k.circle(10),
            k.scale(1.5, 0.5),
            k.color(0, 0, 0),
            k.opacity(0.3),
            k.pos(0, yOffset),
            k.anchor("center"),
            k.z(-1)
        ]);
    };

    let currentPlayer: any = null;
    let stepTimer = 0;

    k.scene("game", () => {
        const getCamScale = () => {
            if (k.width() < 640) return k.vec2(0.6, 0.6);
            if (k.width() < 1024) return k.vec2(0.8, 0.8);
            return k.vec2(1, 1);
        };
        k.camScale(getCamScale());

        const TILE_SIZE = 64; 

        const getSpriteOrFallback = (spriteName: string, r: number, g: number, b: number) => {
            try {
                if (k.getSprite(spriteName)) return [k.sprite(spriteName, { width: TILE_SIZE, height: TILE_SIZE })];
            } catch (e) {}
            return [k.rect(TILE_SIZE, TILE_SIZE), k.color(r, g, b)];
        };

        const petaGate = [
            "#############", 
            "#         ###", 
            "# ###===### #", 
            "# ###===### #", 
            "# ###===### #", 
            "# ###===### #", 
            "# ###===### #", 
            "#############"
        ];

        k.addLevel(petaGate, {
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE,
            pos: k.vec2(k.center().x - (13 * TILE_SIZE) / 2, k.center().y - (8 * TILE_SIZE) / 2),
            tiles: {
                " ": () => [], 
                "#": () => [...getSpriteOrFallback("pohon", 10, 50, 10), k.area(), k.body({isStatic: true}), k.z(0), "wall"], 
                "=": () => [...getSpriteOrFallback("jalan", 180, 150, 100), k.z(-1), "path"], 
            }
        });
        
        // Optimize: Use single background node for grass instead of individual tiles
        const gateOrigin = k.vec2(k.center().x - (13 * TILE_SIZE) / 2, k.center().y - (8 * TILE_SIZE) / 2);
        k.add([k.rect(13 * TILE_SIZE, 8 * TILE_SIZE), k.color(30, 100, 30), k.pos(gateOrigin), k.z(-3)]);
        try {
            if (k.getSprite("rumput")) k.add([k.sprite("rumput", { tiled: true, width: 13 * TILE_SIZE, height: 8 * TILE_SIZE }), k.pos(gateOrigin), k.z(-2)]);
        } catch(e) {}

        // Add a giant Gate structure 
        k.add([ k.rect(192, 64), k.color(80, 40, 10), k.pos(k.center().x, k.center().y - 64), k.anchor("center"), k.z(10), "gateShape" ]);

        currentPlayer = k.add([
            k.sprite("playerAsset"), k.scale(1.5), k.pos(k.center().x, k.center().y + 100),
            k.area({ shape: new k.Rect(k.vec2(0, 8), 16, 16) }), k.body(), k.anchor("center"), k.z(0), "player"
        ]);
        if (socketRef.current) socketRef.current.emit("move", {x: currentPlayer.pos.x, y: currentPlayer.pos.y});
        
        const eqNode = currentPlayer.add([
            k.sprite("item_Kayu Jati"),
            k.scale(0.3),
            k.pos(-24, 0),
            k.anchor("center"),
            k.opacity(0),
            "equipmentNode"
        ]);
        currentPlayer.eqNode = eqNode;

        addDropShadow(currentPlayer);

        k.onUpdate(() => {
            k.camScale(getCamScale());
            const ZOOM_LEVEL = k.camScale().x;
            const hVisibleW = k.width() / 2 / ZOOM_LEVEL;
            const hVisibleH = k.height() / 2 / ZOOM_LEVEL;
            const mapWidth = 13 * 64;
            const mapHeight = 8 * 64;
            
            let camX = currentPlayer.pos.x;
            let camY = currentPlayer.pos.y;
            
            const minCamX = (k.center().x - mapWidth / 2) + hVisibleW;
            const maxCamX = (k.center().x + mapWidth / 2) - hVisibleW;
            const minCamY = (k.center().y - mapHeight / 2) + hVisibleH;
            const maxCamY = (k.center().y + mapHeight / 2) - hVisibleH;

            // Only clamp if map is larger than screen
            if (maxCamX > minCamX) camX = Math.max(minCamX, Math.min(maxCamX, camX));
            else camX = k.center().x;
            
            if (maxCamY > minCamY) camY = Math.max(minCamY, Math.min(maxCamY, camY));
            else camY = k.center().y;
            
            k.camPos(camX, camY);
        });

        const npcProps: Record<string, { scale: number, shadowY: number, areaHeight: number, areaOffset: number }> = {
            "kijaga": { scale: 0.15, shadowY: 600, areaHeight: 1200, areaOffset: 400 },
        };
        const activeKijagaProps = npcProps["kijaga"];

        const kijagaComps: any[] = [
            k.pos(k.center().x, k.center().y - 20),
            k.area({ shape: new k.Rect(k.vec2(0, activeKijagaProps.areaOffset), 600, activeKijagaProps.areaHeight) }), k.body({ isStatic: true }), k.anchor("center"), k.z(0), "npc", k.scale(activeKijagaProps.scale),
            { npcId: "kijaga", npcName: "Ki Jaga", originalScale: activeKijagaProps.scale }
        ];
        try {
            kijagaComps.push(k.sprite("kijaga"));
        } catch (e) {
            kijagaComps.push(k.rect(32, 32));
            kijagaComps.push(k.color(200, 50, 50));
        }
        const npc = k.add(kijagaComps);
        addDropShadow(npc, activeKijagaProps.shadowY);

        k.add([ k.rect(k.width(), k.height() / 2 - 40), k.pos(0, 0), k.area(), k.body({ isStatic: true }), k.opacity(0), "wall" ]);

        k.onUpdate("npc", (n: any) => {
            if (lowGraphicsRef.current) {
                if (n.scale && n.originalScale) {
                    n.scale.x = n.originalScale;
                    n.scale.y = n.originalScale;
                }
                return;
            }
            if (!n.scale || !n.originalScale) return;
            n.scale.x = n.originalScale + Math.sin(k.time() * 4) * (0.05 * n.originalScale);
            n.scale.y = n.originalScale - Math.sin(k.time() * 4) * (0.05 * n.originalScale);
        });

        initPlayerMovementAndCamera();
    });

    k.scene("open_world", () => {
        const getCamScale = () => {
            if (k.width() < 640) return k.vec2(0.7, 0.7); 
            if (k.width() < 1024) return k.vec2(0.85, 0.85); 
            return k.vec2(1, 1); 
        };
        k.camScale(getCamScale());
        k.onUpdate(() => { k.camScale(getCamScale()); });

        const petaDemak = [
            "##################################################", 
            "##################################################", 
            "###         ooooo         =                  #####", 
            "###        ooooooo        =                  #####", 
            "###         ooooo         =         JJJJJ    #####", 
            "###                       =         JJJJJ    #####", 
            "###                       =         JJJJJ    #####", 
            "###                       =                  #####", 
            "###                       =                  #####", 
            "###    ====================                  #####", 
            "###    =                                     #####", 
            "###    =                                     #####", 
            "###    =                        =============#####", 
            "###    =                        =            #####", 
            "###    ==========================     JJJJJ  #####", 
            "###                             =     JJJJJ  #####", 
            "###                             =     JJJJJ  #####", 
            "###                             =            #####", 
            "###                             =            #####", 
            "###             =================            #####", 
            "###                     =                    #####", 
            "###                     =                    #####", 
            "###....                 =                    #####", 
            "###....                 =                    #####", 
            "###....                 =                    #####", 
            "~~~~~~~~~~~~~~~~~~~~~~~+++~~~~~~~~~~~~~~~~~~~~~~~~", 
            "~~~~~~~~~~~~~~~~~~~~~~~+++~~~~~~~~~~~~~~~~~~~~~~~~", 
            "~~~~~~~~~~~~~~~~~~~~~~~+++~~~~~~~~~~~~~~~~~~~~~~~~", 
            "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~##", 
            "##################################################"  
        ];

        const TILE_SIZE = 64; 

        const getSpriteOrFallback = (spriteName: string, r: number, g: number, b: number) => {
            try {
                if (k.getSprite(spriteName)) return [k.sprite(spriteName, { width: TILE_SIZE, height: TILE_SIZE })];
            } catch (e) {}
            return [k.rect(TILE_SIZE, TILE_SIZE), k.color(r, g, b)];
        };
        
        k.addLevel(petaDemak, {
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE,
            tiles: {
                " ": () => [], 
                ".": () => [],
                "#": () => [...getSpriteOrFallback("pohon", 10, 50, 10), k.area(), k.body({isStatic: true}), k.z(0), "wall"], 
                "o": () => [...getSpriteOrFallback("pohon", 15, 70, 15), k.area(), k.body({isStatic: true}), k.z(0), "wall"],  
                "J": () => [...getSpriteOrFallback("joglo", 120, 60, 20), k.area(), k.body({isStatic: true}), k.z(0), "wall"], 
                "~": () => [...getSpriteOrFallback("air", 30, 30, 150), k.area(), k.body({isStatic: true}), k.z(-2), "wall", "water", k.color(255, 255, 255)],  
                "=": () => [...getSpriteOrFallback("jalan", 180, 150, 100), k.z(-1), "path"], 
                "+": () => [...getSpriteOrFallback("jembatan", 100, 50, 20), k.z(-1), "path"],  
            }
        });
        
        // Optimize: Use single background node for grass instead of individual tiles
        k.add([k.rect(50 * TILE_SIZE, 30 * TILE_SIZE), k.color(30, 100, 30), k.pos(0,0), k.z(-3)]);
        try {
            if (k.getSprite("rumput")) k.add([k.sprite("rumput", { tiled: true, width: 50 * TILE_SIZE, height: 30 * TILE_SIZE }), k.pos(0,0), k.z(-2)]);
        } catch(e) {}

        // Add ripple animation to water tiles
        k.onUpdate("water", (w) => {
            if (lowGraphicsRef.current) return;
            const t = k.time();
            const offset = (w.pos.x / 64 + w.pos.y / 64) * 0.5;
            const wave = Math.sin(t * 3 + offset); 
            // Subtly tint color to simulate ripples
            w.color = k.rgb(220 + wave * 20, 235 + wave * 15, 255);
            // Optionally, add a slight scale pulse:
            // w.scale = k.vec2(1 + wave * 0.05); // this could cause gaps though, let's stick to color pulse
        });

        currentPlayer = k.add([
            k.sprite("playerAsset"), k.scale(1.5), 
            k.pos((24 * TILE_SIZE) + (TILE_SIZE / 2), (26 * TILE_SIZE) + (TILE_SIZE / 2)), 
            k.area({ shape: new k.Rect(k.vec2(0, 8), 16, 16) }), k.body(), k.anchor("center"), k.z(0), "player",
            { afkTimer: 0 }
        ]);
        if (socketRef.current) socketRef.current.emit("move", {x: currentPlayer.pos.x, y: currentPlayer.pos.y});
        
        const eqNode = currentPlayer.add([
            k.sprite("item_Kayu Jati"),
            k.scale(0.3),
            k.pos(-24, 0),
            k.anchor("center"),
            k.opacity(0),
            "equipmentNode"
        ]);
        currentPlayer.eqNode = eqNode;

        addDropShadow(currentPlayer); 

        const makeFallbackNpc = (x:number, y:number, r:number, g:number, b:number, id:string, name:string) => {
            const npcProps: Record<string, { scale: number, shadowY: number, areaHeight: number, areaOffset: number }> = {
                "arsitek": { scale: 0.08, shadowY: 450, areaHeight: 800, areaOffset: 250 },
                "dalang": { scale: 0.08, shadowY: 450, areaHeight: 800, areaOffset: 250 },
                "kijaga": { scale: 0.08, shadowY: 450, areaHeight: 800, areaOffset: 250 },
                "prajurit": { scale: 0.08, shadowY: 450, areaHeight: 800, areaOffset: 250 },
                "syahbandar": { scale: 0.08, shadowY: 450, areaHeight: 800, areaOffset: 250 },
                "kangchill": { scale: 0.08, shadowY: 450, areaHeight: 800, areaOffset: 250 },
                "mancing": { scale: 0.08, shadowY: 450, areaHeight: 800, areaOffset: 250 },
                "kakek_rawa": { scale: 0.08, shadowY: 450, areaHeight: 800, areaOffset: 250 },
            };
            const props = npcProps[id] || { scale: 0.08, shadowY: 450, areaHeight: 800, areaOffset: 250 };

            const comps: any[] = [
                k.pos((x * TILE_SIZE) + (TILE_SIZE / 2), (y * TILE_SIZE) + (TILE_SIZE / 2)),
                k.area({ shape: new k.Rect(k.vec2(0, props.areaOffset), 800, props.areaHeight) }), k.body({isStatic: true}), k.anchor("center"), k.z(0), "npc", k.scale(props.scale),
                { npcId: id, npcName: name, originalScale: props.scale }
            ];
            
            try {
                if (k.getSprite(id)) {
                    comps.push(k.sprite(id));
                } else {
                    comps.push(k.rect(32, 32));
                    comps.push(k.color(r, g, b));
                }
            } catch(e) {
                comps.push(k.rect(32, 32));
                comps.push(k.color(r, g, b));
            }

            const n = k.add(comps);
            addDropShadow(n, props.shadowY);
        };
        makeFallbackNpc(22, 24, 100, 100, 250, "prajurit", "Veteran Malaka");
        makeFallbackNpc(35, 15, 200, 150, 0, "arsitek", "Arsitek Masjid");
        makeFallbackNpc(12, 6, 150, 50, 150, "dalang", "Sang Dalang");
        makeFallbackNpc(15, 6, 50, 200, 200, "syahbandar", "Syahbandar");

        // Tikar at (3, 22) to (6, 24)
        const tikar = k.add([
            k.sprite("tikar_santai", { width: 4 * TILE_SIZE, height: 3 * TILE_SIZE }),
            k.pos(3 * TILE_SIZE, 22 * TILE_SIZE),
            k.area(), k.z(-2), "npc",
            { npcId: "tikar", npcName: "Tikar Santai" }
        ]);
        
        // Kang Chill at (6, 24)
        makeFallbackNpc(6, 24, 100, 200, 255, "kangchill", "Kang Chill");
        makeFallbackNpc(14, 24, 0, 150, 255, "mancing", "Area Memancing");
        
        // Kakek Rawa at (45, 20)
        makeFallbackNpc(45, 20, 100, 200, 100, "kakek_rawa", "Kakek Rawa");
        k.add([ k.sprite("bibit_bakau"), k.pos(44 * TILE_SIZE, 20 * TILE_SIZE), k.z(-1), k.scale(0.8) ]);
        k.add([ k.sprite("bibit_bakau"), k.pos(46 * TILE_SIZE, 21 * TILE_SIZE), k.z(-1), k.scale(0.8) ]);
        k.add([ k.sprite("bibit_bakau"), k.pos(45 * TILE_SIZE, 19 * TILE_SIZE), k.z(-1), k.scale(0.8) ]);

        initPlayerMovementAndCamera();
    });

    const initPlayerMovementAndCamera = () => {
        k.onDraw(() => {
            Object.values(remotePlayersRef.current).forEach((rp: any) => {
                // Only draw if they are in the same appState (scene)
                if (rp.appState === appStateRef.current) {
                    const spriteName = rp.avatar ? `avatar_${rp.id}` : "playerAsset";
                    const actualSprite = k.getSprite(spriteName) ? spriteName : "playerAsset";
                    
                    k.drawSprite({
                        sprite: actualSprite,
                        pos: k.vec2(rp.x, rp.y),
                        anchor: "center",
                        scale: 1.5,
                    });
                    
                    if (rp.selectedEquipment !== null && rp.selectedEquipment !== undefined && rp.inventory) {
                        const itemName = rp.selectedEquipment;
                        if (itemName && k.getSprite("item_" + itemName)) {
                            k.drawSprite({
                                sprite: "item_" + itemName,
                                pos: k.vec2(rp.x - 30, rp.y), // offset to side
                                anchor: "center",
                                scale: 0.45
                            });
                        }
                    }
                }
            });
        });

        const hintObj = k.add([
            k.text("!", { size: 32, transform: (idx, ch) => ({
                color: k.rgb(255, 200, 50),
            })}),
            k.pos(0, 0),
            k.anchor("center"),
            k.scale(1),
            k.z(1000),
            k.opacity(0),
            "interactionHint"
        ]);
        let hintTime = 0;

        k.onUpdate(() => {
            if (currentPlayer && currentPlayer.eqNode) {
                const eqNode = currentPlayer.eqNode;
                if (selectedEquipmentRef.current !== null && inventoryRef.current.includes(selectedEquipmentRef.current)) {
                        const itemName = selectedEquipmentRef.current;
                        const details = INVENTORY_DETAILS[itemName];
                        if (details) {
                            eqNode.use(k.sprite("item_" + itemName));
                            eqNode.opacity = 1;
                        } else {
                            eqNode.opacity = 0;
                        }
                    } else {
                        eqNode.opacity = 0;
                    }
                }
            
            const allZObjects = [...k.get("player"), ...k.get("npc"), ...k.get("wall")];
            allZObjects.forEach((obj) => {
                if (typeof obj.z !== 'undefined' && obj.pos && obj.npcId !== "tikar") {
                    obj.z = obj.pos.y;
                }
            });

            if (currentPlayer && !showChatRef.current && !isWastedRef.current && !showFishingRef.current) {
                let nearestDist = Infinity;
                let nearestNpc: any = null;
                k.get("npc").forEach((npc) => {
                    if (npc.npcId === "tikar") return; // disable direct interaction with tikar
                    
                    const dist = currentPlayer.pos.dist(npc.pos);
                    if (dist < 80 && dist < nearestDist) {
                        nearestDist = dist;
                        nearestNpc = npc;
                    }
                });

                if (nearestNpc) {
                    isNearNpcRef.current = true;
                    setIsNearNpc(true);
                    setActiveNpcId(nearestNpc.npcId);
                    setActiveNpcName(nearestNpc.npcName);
                    
                    hintObj.opacity = 1;
                    hintObj.pos.x = nearestNpc.pos.x;
                    hintObj.pos.y = nearestNpc.pos.y - 64; 
                    hintTime += k.dt();
                    const scaleFactor = 1 + Math.sin(hintTime * 8) * 0.2;
                    hintObj.scale = k.vec2(scaleFactor, scaleFactor);
                } else {
                    hintObj.opacity = 0;
                    if (isNearNpcRef.current) {
                        isNearNpcRef.current = false;
                        setIsNearNpc(false);
                        setCurrentQuestionIndex(0);
                    }
                }
            } else {
                 hintObj.opacity = 0;
            }

            if (floatingTagsRef.current) {
                let offsetX = 0;
                let offsetY = 0;
                let scaleW = 1;
                let scaleH = 1;
                const currentTagIds = new Set<string>();

                const updateTag = (id: string, x: number, y: number, htmlStr: string) => {
                    currentTagIds.add(id);
                    let el = document.getElementById(id);
                    if (!el) {
                        el = document.createElement("div");
                        el.id = id;
                        el.style.position = "absolute";
                        el.style.left = "0";
                        el.style.top = "0";
                        el.style.willChange = "transform";
                        floatingTagsRef.current!.appendChild(el);
                    }
                    if (el.dataset.html !== htmlStr) {
                        el.innerHTML = htmlStr;
                        el.dataset.html = htmlStr;
                    }
                    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
                };

                if (canvasRef.current) {
                    const rect = canvasRef.current.getBoundingClientRect();
                    offsetX = rect.left;
                    offsetY = rect.top;
                    scaleW = rect.width / k.width();
                    scaleH = rect.height / k.height();
                }
                
                // Player Tag
                if (currentPlayer) {
                    const screenPos = k.toScreen(currentPlayer.pos);
                    const cssX = offsetX + screenPos.x * scaleW;
                    const cssY = offsetY + screenPos.y * scaleH;
                    const hasSurya = inventoryRef.current.includes("Surya Majapahit");
                    const hasCompletedAll = hasSurya || (inventoryRef.current.filter(i => ["Batu Karang", "Kayu Jati", "Saka Tatal", "Dana Emas"].includes(i)).length >= 4) || appStateRef.current === "victory";
                    const isAfk = currentPlayer.afkTimer > 30 && hasCompletedAll;
                    const hasCortisol = completedNpcsRef.current.includes("tikar");
                    let medalHtml = "";
                    if (hasSurya) medalHtml += `<img src="data:image/svg+xml;base64,${btoa('<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><g transform="translate(32,32)"><polygon points="0,-28 6,-10 28,0 6,10 0,28 -6,10 -28,0 -6,-10" fill="#ffd700" /><polygon points="0,-20 5,-7 20,0 5,7 0,20 -5,7 -20,0 -5,-7" fill="#ffa500" transform="rotate(45)" /><circle cx="0" cy="0" r="10" fill="#ff8c00" /><circle cx="0" cy="0" r="5" fill="#ffd700" /></g></svg>')}" class="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] ml-1" />`;
                    if (hasCortisol) medalHtml += `<img src="/assets/medal-lowcortisol.jpg" class="w-8 h-8 rounded-full object-contain drop-shadow-[0_0_8px_rgba(55,148,110,0.8)] ml-1" />`;
                    
                    let levelStr = getPlayerLevelText(inventoryRef.current, completedNpcsRef.current);

                    const htmlContent = `
                        <div class="group">
                            <div class="transform transition-transform group-hover:-translate-y-1">
                                <div class="flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-md border border-white/10 shadow-lg">
                                    <span class="font-mono font-bold text-[10px] text-white drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] tracking-widest whitespace-nowrap flex items-center">
                                        ${playerName}${medalHtml}
                                    </span>
                                </div>
                            </div>
                            ${isAfk ? `
                            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <span class="font-bold text-emerald-500 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] text-[12px]">
                                    Low Cortisol Mode: Aktif 🧘‍♂️
                                </span>
                            </div>
                            ` : `
                            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <span class="font-bold drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] text-[10px] ${getPlayerLevelColor(inventoryRef.current, completedNpcsRef.current)}">
                                    ${levelStr}
                                </span>
                            </div>
                            `}
                        </div>
                    `;
                    updateTag("tag_local_player", cssX, cssY - 50, htmlContent);
                }

                // Remote Players Tags
                Object.values(remotePlayersRef.current).forEach((rp: any) => {
                    if (rp.appState === appStateRef.current) {
                        const screenPos = k.toScreen(k.vec2(rp.x, rp.y));
                        const cssX = offsetX + screenPos.x * scaleW;
                        const cssY = offsetY + screenPos.y * scaleH;
                        if (screenPos.x > -100 && screenPos.x < k.width() + 100 && screenPos.y > -100 && screenPos.y < k.height() + 100) {
                            const hasSurya = rp.inventory?.includes("Surya Majapahit");
                            const hasCortisol = rp.completedNpcs?.includes("tikar");
                            let medalHtml = "";
                            if (hasSurya) medalHtml += `<img src="data:image/svg+xml;base64,${btoa('<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><g transform="translate(32,32)"><polygon points="0,-28 6,-10 28,0 6,10 0,28 -6,10 -28,0 -6,-10" fill="#ffd700" /><polygon points="0,-20 5,-7 20,0 5,7 0,20 -5,7 -20,0 -5,-7" fill="#ffa500" transform="rotate(45)" /><circle cx="0" cy="0" r="10" fill="#ff8c00" /><circle cx="0" cy="0" r="5" fill="#ffd700" /></g></svg>')}" class="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] ml-1" />`;
                            if (hasCortisol) medalHtml += `<img src="/assets/medal-lowcortisol.jpg" class="w-8 h-8 rounded-full object-contain drop-shadow-[0_0_8px_rgba(55,148,110,0.8)] ml-1" />`;
                            
                            let levelStr = getPlayerLevelText(rp.inventory || [], rp.completedNpcs || []);
                            
                            const htmlContent = `
                                <div class="group">
                                    <div class="transform transition-transform group-hover:-translate-y-1">
                                        <div class="flex items-center justify-center bg-blue-900/60 backdrop-blur-sm px-4 py-1.5 rounded-md border border-blue-500/30 shadow-lg">
                                            ${rp.avatar ? `<img src="${rp.avatar}" class="w-6 h-6 rounded-sm border border-white/50 mr-2" />` : ''}
                                            <span class="font-mono font-bold text-[10px] text-blue-100 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] tracking-widest whitespace-nowrap flex items-center">
                                                ${rp.name || "Pemain Lain"}${medalHtml}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <span class="font-bold drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] text-[10px] ${getPlayerLevelColor(rp.inventory || [], rp.completedNpcs || [])}">
                                            ${levelStr}
                                        </span>
                                    </div>
                                </div>
                            `;
                            updateTag(`tag_remote_${rp.id}`, cssX, cssY - 50, htmlContent);
                        }
                    }
                });

                // NPC Tags
                k.get("npc").forEach(npc => {
                    if (npc.npcId === "tikar") return;
                    const screenPos = k.toScreen(npc.pos);
                    const cssX = offsetX + screenPos.x * scaleW;
                    const cssY = offsetY + screenPos.y * scaleH;
                    if (screenPos.x > -100 && screenPos.x < k.width() + 100 && screenPos.y > -100 && screenPos.y < k.height() + 100) {
                        const isCompleted = completedNpcsRef.current.includes(npc.npcId);
                        const htmlContent = `
                            <div class="group">
                                <div class="transform transition-transform group-hover:-translate-y-1">
                                    <div class="flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-md border border-[#ddc1ae]/30 shadow-lg">
                                        <span class="font-mono font-bold text-[10px] text-[#ffb77d] drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] tracking-widest whitespace-nowrap">
                                            ${npc.npcName || npc.npcId}
                                        </span>
                                    </div>
                                </div>
                                ${isCompleted ? `
                                <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap mt-1 pointer-events-none">
                                    <span class="font-bold drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] text-[8px] text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded border border-emerald-900">
                                        Terimakasih sudah menyelesaikan quest ini
                                    </span>
                                </div>
                                ` : ''}
                            </div>
                        `;
                        updateTag(`tag_npc_${npc.npcId}`, cssX, cssY - 60, htmlContent);
                    }
                });
                
                // Remove unused tags
                Array.from(floatingTagsRef.current.children).forEach((child: any) => {
                    if (!currentTagIds.has(child.id)) {
                        child.remove();
                    }
                });
            }
        });

        currentPlayer.onUpdate(() => {
            // Pause movement if in dialog, wasted, paused, or looking at quests/achievements/lore
            if (isWastedRef.current || showChatRef.current || isPausedRef.current || showQuestLogRef.current || showFullInventoryRef.current || showAchievementRef.current || showLoreRef.current || showTutorialRef.current) {
                return; 
            }
            
            const SPEED = 320; 
            const m = moveState.current;
            
            let isMoving = false;
            let nx = 0;
            let ny = 0;
            
            if (k.isKeyDown("left") || k.isKeyDown("a") || m.left) { nx -= SPEED; isMoving = true; }
            if (k.isKeyDown("right") || k.isKeyDown("d") || m.right) { nx += SPEED; isMoving = true; }
            if (k.isKeyDown("up") || k.isKeyDown("w") || m.up) { ny -= SPEED; isMoving = true; }
            if (k.isKeyDown("down") || k.isKeyDown("s") || m.down) { ny += SPEED; isMoving = true; }

            if (nx !== 0 && ny !== 0) {
               // Normalize diagonal speed
               const length = Math.sqrt(nx * nx + ny * ny);
               nx = (nx / length) * SPEED;
               ny = (ny / length) * SPEED;
            }

            if (isMoving) {
                currentPlayer.move(nx, ny);
                stepTimer += k.dt();
                if (stepTimer > 0.3) {
                    playSound.step();
                    stepTimer = 0;
                }
                if (socketRef.current) socketRef.current.emit("move", {x: currentPlayer.pos.x, y: currentPlayer.pos.y});
                currentPlayer.afkTimer = 0;
            } else {
                stepTimer = 0.3; // ready to step immediately
                currentPlayer.afkTimer += k.dt();
            }

            // Bounding box (Blokade) agar player tidak keluar map
            if (appStateRef.current === "game") {
                const mapWidth = 13 * 64;
                const mapHeight = 8 * 64;
                const minX = (k.center().x - mapWidth / 2) + 64;
                const maxX = (k.center().x + mapWidth / 2) - 64;
                const minY = (k.center().y - mapHeight / 2) + 64;
                const maxY = (k.center().y + mapHeight / 2) - 64;
                currentPlayer.pos.x = Math.max(minX, Math.min(maxX, currentPlayer.pos.x));
                currentPlayer.pos.y = Math.max(minY, Math.min(maxY, currentPlayer.pos.y));
            } else if (appStateRef.current === "open_world") {
                const mapWidth = 50 * 64;
                const mapHeight = 30 * 64;
                currentPlayer.pos.x = Math.max(64, Math.min(mapWidth - 64, currentPlayer.pos.x));
                currentPlayer.pos.y = Math.max(64, Math.min(mapHeight - 64, currentPlayer.pos.y));
            }

            if (appStateRef.current === "open_world") {
                const mapWidth = 50 * 64; 
                const mapHeight = 30 * 64; 
                const ZOOM_LEVEL = k.camScale().x; 
                
                let camX = currentPlayer.pos.x;
                let camY = currentPlayer.pos.y;
                
                const hVisibleW = k.width() / 2 / ZOOM_LEVEL;
                const hVisibleH = k.height() / 2 / ZOOM_LEVEL;

                if (camX < hVisibleW) camX = hVisibleW;
                if (camX > mapWidth - hVisibleW) camX = mapWidth - hVisibleW;
                if (camY < hVisibleH) camY = hVisibleH;
                if (camY > mapHeight - hVisibleH) camY = mapHeight - hVisibleH;

                k.camPos(k.camPos().lerp(k.vec2(camX, camY), k.dt() * 6));
            }
        });
    };

    k.go(appStateRef.current);

    return () => {
        k.quit();
        kRef.current = null;
    };
  }, [isKaboomRunning, playerAvatar, playerName]); 

  // Watch for appState changes to switch scene without tearing down kaboom
  useEffect(() => {
     if (kRef.current && (appState === "game" || appState === "open_world")) {
         kRef.current.go(appState);
     }
  }, [appState]); 

  // Watch for Map tracking
  useEffect(() => {
    if (showMap && kRef.current) {
        const interval = setInterval(() => {
            const players = kRef.current!.get("player");
            if (players && players.length > 0) {
                setPlayerGridPos({
                    x: Math.round(players[0].pos.x / 64),
                    y: Math.round(players[0].pos.y / 64)
                });
            }
        }, 500);
        return () => clearInterval(interval);
    }
  }, [showMap]);

  // ==========================================
  // RENDERING UI
  // ==========================================
  if (authChecking || appState === "loading") {
      return (
        <main className="bg-[#0f172a] text-white min-h-screen flex flex-col overflow-hidden relative items-center justify-center font-mono">
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.7)] z-10"></div>
          <div className="absolute inset-0 -z-10 opacity-10 pointer-events-none">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxWBbngKDFjL-Hf2ALA-2mId6SNng2HGpyGGD88c1oWSQz2dmuKtuVL5aw7SQnSnQ4vAharI7czSs67vXeNUFr51nBlk_o-Wa_54g_u2KuF1xI8den1DKunlAIzvQqLIujzDsDMnaZp01ashfoFKvbtbikiWNZaADaRwh8nKPb_EyD4lYph_AOCNoeTLd0c2OA3L6IsQW_wvHa3udcNhoSFr5Ocm2fv7IMS45X9y_Wy-3qmVrqqdvGLLgVhXPZlZQOzn80gOWA4KI" 
                 className="w-full h-full object-cover grayscale" alt="bg" />
          </div>
          <div className="z-20 text-center animate-pulse">
             <h1 className="text-2xl mt-8 font-black tracking-[0.2em] text-[#ff8c00] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                MEMUAT...
             </h1>
          </div>
        </main>
      )
  }

  if (appState === "intro") {
    return (
      <main className="bg-[#0f172a] text-white min-h-screen flex flex-col overflow-hidden relative items-center justify-center font-mono">
        <style dangerouslySetInnerHTML={{__html: `
          div#root > main:nth-of-type(1) > div:nth-of-type(4) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) { display: none !important; }
          div#root > main:nth-of-type(1) > div:nth-of-type(4) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) { display: none !important; }
        `}} />
        {/* Map Scene CSS Background */}
        <div className="absolute inset-0 z-0 bg-[#3e2723]/80">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4e342e] via-[#3e2723] to-[#1a100c] opacity-90" />
          
          {/* Simulated Water Area (Sepia Tones) */}
          <div className="absolute bottom-0 right-0 w-[120%] sm:w-[80%] h-[40%] sm:h-[60%] bg-[#5d4037]/40 border-t-4 border-l-4 border-amber-800/30 rounded-tl-[100px] sm:rounded-tl-[300px] blur-[2px] shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
             <div className="absolute top-8 left-1/4 w-32 h-1 bg-amber-600/30 rounded-full blur-[1px]"></div>
             <div className="absolute top-24 left-2/3 w-48 h-1 bg-amber-600/20 rounded-full blur-[1px]"></div>
             <div className="absolute top-16 left-1/2 w-64 h-1.5 bg-amber-500/20 rounded-full blur-[2px]"></div>
          </div>
          
          {/* Simulated Forest Area (Dark Olive) */}
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#1b5e20]/20 rounded-br-[400px] blur-[10px] border-b-8 border-r-8 border-green-950/40"></div>
          <div className="absolute top-[20%] left-[10%] w-32 h-32 bg-[#2e7d32] rounded-full blur-[20px] opacity-40"></div>
          <div className="absolute top-[10%] right-[20%] w-64 h-64 bg-[#1b5e20] rounded-full blur-[40px] opacity-50"></div>
          <div className="absolute bottom-[30%] left-[5%] w-48 h-48 bg-[#33691e] rounded-full blur-[30px] opacity-40"></div>
          
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.95)] z-10"></div>
        </div>

        {/* Top Right Tab - Mode Pengembaraan */}
        <div className="absolute top-0 right-4 sm:right-8 z-30 bg-[#5c4033]/90 border-x border-b border-[#cd853f]/60 px-3 py-2 sm:px-5 sm:py-3 rounded-b-xl flex items-center gap-2 shadow-[0_4px_15px_rgba(0,0,0,0.6)] backdrop-blur-sm border-t-0">
          <img src={getAssetUrl("surya")} alt="Surya" className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_0_5px_rgba(255,215,0,0.8)] animate-[spin_10s_linear_infinite]" />
          <span className="text-[#f5deb3] font-serif font-bold uppercase tracking-[0.15em] text-[10px] sm:text-xs text-shadow-sm">Mode Pengembaraan</span>
        </div>

        <div className="relative z-20 flex flex-col items-center justify-center w-full h-full max-h-[100dvh] overflow-y-auto px-4 py-8">
            {/* Top Center Logo */}
            <div className="text-center flex flex-col items-center mb-6 sm:mb-10">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-black tracking-[0.1em] text-[#ffb300] drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] uppercase scale-y-105">
                BINTORO.IO
              </h1>
              <div className="h-0.5 w-3/4 max-w-[300px] bg-gradient-to-r from-transparent via-[#ffd54f]/70 to-transparent mt-4 mb-3 rounded-full" />
              <p className="text-[10px] sm:text-xs md:text-sm text-[#ffe082]/90 tracking-[0.25em] uppercase font-serif drop-shadow-md">
                15th Century Javanese Chronicles
              </p>
            </div>

            {/* Login Panel - Ancient Stone Structure */}
            <div className="p-6 sm:p-8 md:p-10 bg-[#1a1c29] border-[4px] border-[#4a3b2c] rounded-xl shadow-[0_0_40px_rgba(234,88,12,0.15),inset_0_0_30px_rgba(0,0,0,0.8)] relative max-w-[90%] sm:max-w-md w-full flex flex-col items-center backdrop-blur-sm mt-2 sm:mt-4 flex-shrink-0">
              {/* Glowing corner stones */}
              <div className="absolute -top-[6px] -left-[6px] w-4 h-4 bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.8)] border border-orange-300" />
              <div className="absolute -top-[6px] -right-[6px] w-4 h-4 bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.8)] border border-orange-300" />
              <div className="absolute -bottom-[6px] -left-[6px] w-4 h-4 bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.8)] border border-orange-300" />
              <div className="absolute -bottom-[6px] -right-[6px] w-4 h-4 bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.8)] border border-orange-300" />
              
              <div className="text-center mb-6 sm:mb-8 relative">
                <span className="material-symbols-outlined text-4xl sm:text-5xl text-orange-400 drop-shadow-[0_0_15px_rgba(234,88,12,0.6)] mb-2">vpn_key</span>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-orange-500/20 blur-xl rounded-full -z-10"></div>
                <h2 className="text-slate-300 text-sm sm:text-base uppercase tracking-[0.2em] font-bold mt-2">Gerbang Kadipaten</h2>
              </div>

              {/* Main Button */}
              <button onClick={handleAuth} 
                      className="w-full relative group overflow-hidden bg-gradient-to-b from-amber-500 to-orange-600 rounded-xl border-2 border-orange-300/50 shadow-[0_6px_0_#9a3412,0_15px_20px_rgba(0,0,0,0.6)] active:shadow-[0_0px_0_#9a3412,0_0px_0_rgba(0,0,0,0.6)] active:translate-y-[6px] transition-all p-3 sm:p-5">
                  {/* Textured overlay pattern */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px]" />
                  
                  {/* Subtle glow / shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
                  
                  <div className="flex items-center justify-center gap-3 relative z-10 w-full">
                    <span className="text-white font-black text-xs sm:text-sm uppercase tracking-[0.2em] drop-shadow-[0_2px_2px_rgba(154,52,18,0.9)] max-w-full truncate">
                      Mulai Pengembaraan (Login)
                    </span>
                  </div>
              </button>
              
              <p className="mt-4 text-center text-[10px] sm:text-xs text-orange-200/90 font-sans px-4 py-2 bg-orange-900/30 rounded-lg border border-orange-500/20 leading-relaxed">
                 <b>Pemberitahuan:</b> Ekspedisi ini mewajibkan Anda untuk <b>Login Google</b> semata-mata agar sistem dapat <b>menyimpan progres petualangan</b> Anda dengan aman dan menempatkan prestasi Anda di dalam <b>Klasemen Pembangunan (Leaderboard)</b>. 
              </p>

              <p className="mt-4 text-center text-[10px] sm:text-xs text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 leading-snug">
                 <span className="material-symbols-outlined text-[14px]">info</span>
                 <span className="opacity-80">Jika login gagal/tertutup, klik ikon <b>↗️ (Open in new tab)</b> di pojok kanan atas layar.</span>
              </p>

              {/* Legal & Kebijakan Link */}
              <button 
                onClick={() => setShowLegal(true)}
                className="mt-6 w-full text-center text-[10px] text-slate-500 hover:text-orange-400 transition-colors uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2"
              >
                 <span className="material-symbols-outlined text-[12px]">subject</span>
                 Legal & Kebijakan
              </button>
            </div>
        </div>

        {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      </main>
    );
  }

  if (appState === "setup") {
    return (
      <main className="bg-[#0f172a] text-white min-h-screen flex flex-col items-center justify-center p-8 relative font-mono">
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.7)] z-10"></div>
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 shadow-2xl z-20">
            <div className="space-y-8">
                <form onSubmit={masukGame}>
                    <div className="space-y-4 mb-6">
                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">Nama Pengembara</label>
                        <input className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-xl text-orange-400 focus:outline-none focus:border-white/20 transition-all shadow-inner" 
                               type="text" required maxLength={15} value={playerName} onChange={(e) => {
                                 setPlayerName(e.target.value);
                                 if (playerNameError) setPlayerNameError("");
                               }} placeholder="Masukkan nama..." />
                        {playerNameError && <p className="text-red-500 font-bold text-sm mt-2">{playerNameError}</p>}
                    </div>
                    <div className="space-y-4 mb-8">
                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">Unggah Avatar</label>
                        <div className="relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl cursor-pointer transition-all shadow-inner overflow-hidden">
                            <input type="file" accept="image/*" required={!playerAvatar} onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" title="Klik untuk mengunggah avatar" />
                            <div className="flex items-center gap-3 z-10 pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400">upload</span>
                                <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">{playerAvatar ? 'Ubah Avatar' : 'Pilih Gambar...'}</span>
                            </div>
                            {playerAvatar && <img src={playerAvatar} className="w-16 h-16 border-2 border-white shadow-lg rounded-sm object-cover relative z-10 pointer-events-none" />}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 rounded-full border-4 border-orange-400 shadow-2xl py-4 flex items-center justify-center text-white font-black text-lg active:scale-95 transition-transform uppercase tracking-widest">
                        Siap Melangkah
                    </button>
                    
                    <div className="mt-6 flex justify-center">
                       <button 
                         type="button"
                         onClick={() => setShowLegal(true)}
                         className="text-[10px] text-slate-500 hover:text-orange-400 transition-colors uppercase tracking-[0.2em] font-bold flex items-center gap-2"
                       >
                          <span className="material-symbols-outlined text-[12px]">subject</span>
                          Legal & Kebijakan
                       </button>
                    </div>
                </form>
            </div>
        </div>
        {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      </main>
    );
  }

  if (appState === "victory") {
      return (
        <main className="bg-black text-white min-h-screen flex flex-col items-center justify-center p-8 relative font-mono overflow-hidden">
          {/* Deep red/gold radial background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/40 via-black to-black z-0 pointer-events-none"></div>
          
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjE1LDAsMC4xKSIvPjwvc3ZnPg==')] opacity-50 z-0 pointer-events-none animate-[pulse_4s_linear_infinite]"></div>

          <div className="z-20 text-center bg-black/60 backdrop-blur-md rounded-3xl border border-amber-500/30 p-12 shadow-[0_0_60px_rgba(217,119,6,0.3)] max-w-3xl relative pointer-events-auto">
            <button 
                onClick={() => { playSound.click(); changeAppState("open_world"); }}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/50 transition-all group"
            >
                <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">close</span>
            </button>

            <h1 className="text-5xl md:text-7xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] uppercase mb-6 leading-tight select-none">KEMENANGAN</h1>
            
            <div className="relative w-48 h-48 mx-auto my-8 flex items-center justify-center">
                {/* Outer spinning aura */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 rounded-full border border-dotted border-yellow-300/30 animate-[spin_15s_linear_infinite_reverse]"></div>
                
                {/* Glowing center */}
                <div className="absolute inset-8 rounded-full bg-amber-500/20 blur-xl animate-pulse"></div>
                
                {/* Surya Majapahit SVG */}
                <svg className="w-32 h-32 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] z-10" viewBox="0 0 64 64" fill="currentColor">
                    <g transform="translate(32,32)">
                        <polygon points="0,-28 6,-10 28,0 6,10 0,28 -6,10 -28,0 -6,-10" fill="#ffd700" />
                        <polygon points="0,-20 5,-7 20,0 5,7 0,20 -5,7 -20,0 -5,-7" fill="#ffa500" transform="rotate(45)" />
                        <circle cx="0" cy="0" r="10" fill="#ff8c00" />
                        <circle cx="0" cy="0" r="5" fill="#ffd700" />
                    </g>
                </svg>
            </div>

            <p className="text-xl md:text-2xl mb-8 leading-relaxed text-slate-200 font-serif font-light">
               Luar biasa, pengembara <b className="text-amber-400 font-mono tracking-widest">{playerName}</b>!
               <br/><br/>
               Masjid Agung Demak berhasil dibangun dengan megah berkat wawasan dan kegigihanmu mengumpulkan pusaka: <span className="text-amber-300 transform scale-110">Surya Majapahit</span>.
            </p>
            
            <p className="text-xs text-amber-500/80 tracking-widest uppercase font-bold mt-4 select-none">
                ~ Surya Majapahit kini bersinar di Tanah Bintoro ~
            </p>

            <button 
                onClick={() => { playSound.click(); changeAppState("open_world"); }}
                className="mt-10 px-8 py-4 bg-gradient-to-r from-amber-700 to-yellow-600 rounded-full font-black text-sm md:text-base uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(217,119,6,0.5)] hover:scale-105 hover:shadow-[0_0_50px_rgba(217,119,6,0.8)] border border-amber-400/50 transition-all active:scale-95"
            >
                Lanjutkan Penjelajahan
            </button>
          </div>
        </main>
      )
  }

  return (
    <main className={`relative w-full h-screen bg-[#0f172a] text-white font-mono overflow-hidden select-none touch-none ${lowGraphics ? 'low-graphics' : ''}`}>
      
      <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center portrait:flex landscape:hidden backdrop-blur-3xl">
        <div className="relative w-16 h-28 md:w-24 md:h-40 border-4 md:border-[6px] border-orange-500/80 rounded-xl md:rounded-2xl mb-8 animate-[rotateDevice_3s_ease-in-out_infinite] shadow-[0_0_30px_rgba(249,115,22,0.3)] bg-black/40 overflow-hidden flex items-center justify-center">
            {/* Screen content representation to make it look like a game */}
            <div className="w-full h-full opacity-30 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:8px_8px]"></div>
            <span className="absolute material-symbols-outlined text-orange-400 text-3xl md:text-5xl drop-shadow-md">screen_rotation</span>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes rotateDevice {
            0%, 15% { transform: rotate(0deg) scale(1); }
            45%, 55% { transform: rotate(-90deg) scale(1.1); }
            85%, 100% { transform: rotate(0deg) scale(1); }
          }
        `}} />
        <h2 className="text-orange-500 font-bold text-lg md:text-2xl uppercase tracking-widest leading-relaxed drop-shadow-[0_2px_10px_rgba(249,115,22,0.8)]">
            Putar Perangkatmu<br/>
            <span className="text-sm md:text-base text-orange-200/80">ke Mode Horizontal (Lanskap)</span>
        </h2>
      </div>

      {/* CINEMATIC TRANSITION OVERLAY */}
      <div 
        className={`fixed inset-0 z-[999] bg-black transition-opacity duration-500 ease-in-out flex flex-col items-center justify-center ${
          transitionState === "fading_out" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
      </div>

      <canvas ref={canvasRef} className="block relative z-0"></canvas>
      
      {/* FLOATING NAME TAGS CONTAINER */}
      <div ref={floatingTagsRef} className="fixed inset-0 z-10 pointer-events-none overflow-hidden"></div>
      
      {/* SIDE NAVIGATION TOGGLE */}
      {appState !== "intro" && appState !== "setup" && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`fixed top-24 z-50 p-2 bg-[#181a2a]/90 border-2 border-[#564334] rounded-r-lg text-[#ffb77d] hover:text-white transition-all hidden md:block backdrop-blur-sm pointer-events-auto ${isSidebarOpen ? 'left-64 hidden' : 'left-0'}`}
        >
          <span className="material-symbols-outlined">
            {isSidebarOpen ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>
      )}

      {/* SIDE NAVIGATION */}
      <aside className={`fixed left-0 top-0 h-full flex flex-col p-4 z-40 bg-[#181a2a]/90 backdrop-blur-sm border-r-4 border-[#564334] w-64 pt-24 hidden md:flex font-mono pointer-events-auto transition-transform duration-300 overflow-y-auto overflow-x-hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-24 right-4 text-[#ffb77d] hover:text-white"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="mb-8 mt-4">
          <div className="text-[#ffb77d] font-bold text-lg mb-1 uppercase tracking-widest">Bintoro.io</div>
          <div className={`text-sm font-bold ${getPlayerLevelColor(inventory, completedNpcs)}`}>{getPlayerLevelText(inventory, completedNpcs)}</div>
        </div>
        <nav className="flex flex-col gap-2 flex-grow">
          <div className="flex items-center gap-3 text-[#ddc1ae] p-2 hover:bg-[#272939] transition-all cursor-pointer">
            <span className="material-symbols-outlined">person</span>
            <span className="text-sm uppercase tracking-wider font-mono">{playerName}</span>
          </div>
          <div 
            onClick={() => { playSound.click(); setShowFullInventory(true); }}
            className="flex items-center gap-3 text-[#ddc1ae] p-2 hover:bg-[#272939] transition-all cursor-pointer group">
            <span className="material-symbols-outlined group-hover:text-amber-400 transition-colors">inventory_2</span>
            <span className="text-sm uppercase tracking-wider group-hover:text-amber-100 transition-colors">Inventory</span>
          </div>
          <div 
            onClick={() => { playSound.click(); setShowQuestLog(true); }}
            className="flex items-center gap-3 text-[#ddc1ae] p-2 hover:bg-[#272939] transition-all cursor-pointer group"
          >
            <span className="material-symbols-outlined group-hover:text-[#ffb77d]">scrollable_header</span>
            <span className="text-sm uppercase tracking-wider group-hover:text-[#ffb77d]">Quests</span>
          </div>
          <div 
            onClick={() => { playSound.click(); setShowMap(true); setIsSidebarOpen(false); }}
            className="flex items-center gap-3 text-[#ddc1ae] p-2 hover:bg-[#272939] transition-all cursor-pointer group"
          >
            <span className="material-symbols-outlined group-hover:text-[#ffb77d]">map</span>
            <span className="text-sm uppercase tracking-wider group-hover:text-[#ffb77d]">Map</span>
          </div>
          <div 
            onClick={() => { playSound.click(); setShowTutorial(true); setTutorialStep(0); setIsSidebarOpen(false); }}
            className="flex items-center gap-3 text-[#ddc1ae] p-2 hover:bg-[#272939] transition-all cursor-pointer group"
          >
            <span className="material-symbols-outlined group-hover:text-[#ffb77d]">help</span>
            <span className="text-sm uppercase tracking-wider group-hover:text-[#ffb77d]">Tutorial (Bantuan)</span>
          </div>
          <div 
            onClick={() => { playSound.click(); setShowLore(true); setIsSidebarOpen(false); }}
            className="flex items-center gap-3 text-[#ddc1ae] p-2 hover:bg-[#272939] transition-all cursor-pointer group"
          >
            <span className="material-symbols-outlined group-hover:text-[#ffb77d]">menu_book</span>
            <span className="text-sm uppercase tracking-wider group-hover:text-[#ffb77d]">Sejarah</span>
          </div>
          <div 
            onClick={() => { playSound.click(); setShowLeaderboard(true); setIsSidebarOpen(false); }}
            className="flex items-center gap-3 text-[#ddc1ae] p-2 hover:bg-[#272939] transition-all cursor-pointer group"
          >
            <span className="material-symbols-outlined group-hover:text-[#ffb77d]">trophy</span>
            <span className="text-sm uppercase tracking-wider group-hover:text-[#ffb77d]">Klasemen</span>
          </div>
        </nav>
        <div className="mt-auto border-t-2 border-[#564334] pt-4">
          <button 
            onClick={() => { setInventory([]); changeAppState("intro"); }} // simplified logout
            className="flex items-center gap-3 text-[#ddc1ae] p-2 hover:bg-red-900/50 hover:text-red-400 w-full transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm uppercase tracking-wider">Keluar</span>
          </button>
        </div>
      </aside>

      {/* UI TOP BAR */}
      <div className="absolute top-0 inset-x-0 h-20 flex items-center justify-between px-8 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none transition-all">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black tracking-[0.2em] text-orange-500 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">BINTORO.IO</h1>
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
                PENGEMBARA: <span className="font-mono">{playerName}</span>
                {inventory.includes("Surya Majapahit") && <img src={`data:image/svg+xml;base64,${btoa('<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><g transform="translate(32,32)"><polygon points="0,-28 6,-10 28,0 6,10 0,28 -6,10 -28,0 -6,-10" fill="#ffd700" /><polygon points="0,-20 5,-7 20,0 5,7 0,20 -5,7 -20,0 -5,-7" fill="#ffa500" transform="rotate(45)" /><circle cx="0" cy="0" r="10" fill="#ff8c00" /><circle cx="0" cy="0" r="5" fill="#ffd700" /></g></svg>')}`} className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />}
                {completedNpcs.includes("tikar") && <img src="/assets/medal-lowcortisol.jpg" alt="Medal" className="w-8 h-8 object-contain rounded-full drop-shadow-[0_0_8px_rgba(55,148,110,0.8)]" />}
            </span>
            <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/10 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="material-symbols-outlined text-[12px] text-green-500">signal_cellular_alt</span>
                <span className="text-[10px] font-mono text-green-400 font-bold">{networkPing} ms</span>
            </div>
          </div>
        </div>

        {/* PROGRESS MASJID DEMAK (Open World) */}
        {appState === "open_world" && !showChat && (
          <div className="flex flex-col flex-1 mx-2 md:mx-6 max-w-[200px] md:max-w-[300px]">
            <div className="w-full flex justify-between items-center mb-1">
              <span className="text-[10px] md:text-[11px] text-amber-500 uppercase tracking-widest font-bold drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]">Progres Masjid</span>
              <span className="text-[11px] md:text-sm font-bold tabular-nums drop-shadow-md text-amber-400">
                {(inventory.filter(i => ["Batu Karang", "Kayu Jati", "Saka Tatal", "Dana Emas"].includes(i)).length >= 4 || inventory.includes("Surya Majapahit")) ? 'SELESAI' : `${Math.round((inventory.filter(i => ["Batu Karang", "Kayu Jati", "Saka Tatal", "Dana Emas"].includes(i)).length / 4) * 100)}%`}
              </span>
            </div>
            <div className="w-full h-2.5 md:h-3.5 bg-black/60 rounded-full border border-amber-500/30 overflow-hidden shadow-inner relative">
               <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.1)_4px,rgba(255,255,255,0.1)_8px)] pointer-events-none"></div>
               <div 
                   className="h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(245,158,11,0.8)] relative z-10 bg-gradient-to-r from-amber-600 to-yellow-400" 
                   style={{ width: `${(inventory.filter(i => ["Batu Karang", "Kayu Jati", "Saka Tatal", "Dana Emas"].includes(i)).length >= 4 || inventory.includes("Surya Majapahit")) ? 100 : (inventory.filter(i => ["Batu Karang", "Kayu Jati", "Saka Tatal", "Dana Emas"].includes(i)).length / 4) * 100}%` }}
               ></div>
            </div>
          </div>
        )}

        {/* TIMER */}
        {showChat && !completedNpcs.includes(activeNpcId) && (
          <div className="flex flex-col flex-1 mx-2 md:mx-6 max-w-[200px] md:max-w-[250px]">
            <div className="w-full flex justify-between items-center mb-1">
              <span className="text-[10px] md:text-[11px] text-slate-400 uppercase tracking-widest font-bold">Waktu</span>
              <span className={`text-[11px] md:text-sm font-bold tabular-nums drop-shadow-md ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                00:{timer < 10 ? `0${timer}` : timer}
              </span>
            </div>
            <div className="w-full h-2.5 md:h-3.5 bg-black/60 rounded-full border border-white/10 overflow-hidden shadow-inner relative">
               <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.1)_4px,rgba(255,255,255,0.1)_8px)] pointer-events-none"></div>
               <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(249,115,22,0.8)] relative z-10 ${timer > 10 ? 'bg-gradient-to-r from-orange-600 to-orange-400' : 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse'}`}
                  style={{ width: `${(timer / 30) * 100}%` }}
               ></div>
            </div>
          </div>
        )}

        {/* INVENTORY & MENU */}
        <div className="flex items-center gap-2 md:gap-4 z-50 pointer-events-auto">
          <div className="flex gap-1 md:gap-2">
            {Array.from({length: 4}).map((_, i) => {
               const recentItems = [...inventory].reverse().slice(0, 4);
               const hasItem = i < recentItems.length;
               const itemName = recentItems[i];
               const details = hasItem && INVENTORY_DETAILS[itemName] ? INVENTORY_DETAILS[itemName] : null;

               return (
                 <div key={i} onClick={() => { playSound.click(); if (hasItem) setSelectedEquipment(selectedEquipment === itemName ? null : itemName); }} className={`group relative w-10 h-10 md:w-14 md:h-14 ${hasItem ? 'bg-white/20 backdrop-blur-xl border-2 border-orange-500 text-orange-400 cursor-pointer' : 'bg-white/5 backdrop-blur-md border border-white/10 text-white/20'} ${selectedEquipment === itemName ? 'scale-[1.15] shadow-[0_0_25px_rgba(250,204,21,0.6)] border-yellow-300 !bg-white/30 z-10' : 'shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:scale-110'} rounded flex items-center justify-center flex-col transition-all duration-300`}>
                   {hasItem && details ? (
                      <>
                        <span className="text-lg md:text-xl">{details.icon}</span>
                        <span className="hidden md:block text-[8px] font-bold uppercase mt-1 text-center leading-tight">{details.name}</span>
                        
                        {/* Tooltip Description */}
                        <div className="absolute top-[calc(100%+12px)] right-0 md:left-1/2 md:-translate-x-1/2 w-56 p-4 bg-[#1a1a1a]/95 backdrop-blur-2xl rounded-2xl border border-orange-500/40 opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 hidden group-hover:block scale-95 group-hover:scale-100 origin-top text-left">
                          <div className="absolute -top-2 right-4 md:left-1/2 md:-translate-x-1/2 border-8 border-transparent border-b-orange-500/40"></div>
                          <div className="absolute -top-[7px] right-4 md:left-1/2 md:-translate-x-1/2 border-8 border-transparent border-b-[#1a1a1a]/95"></div>
                          <h4 className="text-orange-400 font-black text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                             <span className="text-lg">{details.icon}</span> {itemName}
                          </h4>
                          <p className="text-slate-300 text-xs leading-relaxed font-serif italic pb-1">{details.desc}</p>
                        </div>
                      </>
                   ) : hasItem ? (
                      <span className="text-[6px] md:text-[8px] font-bold uppercase truncate px-1 text-center leading-tight max-w-[40px] md:max-w-[50px]">{itemName}</span>
                   ) : (
                      <span className="text-[8px] md:text-[10px]">EMPTY</span>
                   )}
                 </div>
               )
            })}
          </div>

          {/* AVATAR */}
          {playerAvatar && (
            <div 
               onClick={() => {
                   playSound.click();
                   setShowAvatarConfirm(true);
               }}
               className="w-10 h-10 md:w-14 md:h-14 rounded overflow-hidden border-2 border-[#101222] shadow-[0_0_0_2px_rgba(249,115,22,0.8)] pointer-events-auto cursor-pointer focus:outline-none transition-transform hover:scale-105"
            >
              <img src={playerAvatar} alt={playerName} className="w-full h-full object-cover" />
            </div>
          )}

          <button 
             onClick={toggleFullscreen}
             className="w-10 h-10 md:w-14 md:h-14 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/20 rounded flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 group shadow-lg"
          >
             <span className="material-symbols-outlined text-xl md:text-2xl group-hover:scale-110 transition-transform duration-300 font-bold">
               {isFullscreen ? "fullscreen_exit" : "fullscreen"}
             </span>
          </button>

          <button 
             onClick={() => { playSound.click(); setIsPaused(true); }}
             className="w-10 h-10 md:w-14 md:h-14 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/20 rounded flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 group shadow-lg"
          >
             <span className="material-symbols-outlined text-xl md:text-2xl group-hover:rotate-45 transition-transform duration-300 font-bold">settings</span>
          </button>
        </div>
      </div>

      {/* QUEST TRACKER HUD */}
      {showQuestTracker && appState !== "intro" && appState !== "setup" && !showChat && !isWasted && !showQuestLog && !showLore && !showMap && !showFishing && (
        <div className={`absolute top-24 ${isSidebarOpen ? 'md:left-72' : 'left-8'} z-20 pointer-events-auto transition-all duration-300 font-mono hidden sm:flex flex-col`}>
          <div className="bg-[#181a2a]/80 backdrop-blur-md border border-[#564334] rounded-lg p-3 w-64 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[#ffb77d] text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none drop-shadow-md">Tujuan Saat Ini</h3>
              <button onClick={() => setShowQuestTracker(false)} className="text-[#ffb77d]/50 hover:text-[#ffb77d] -mt-1 -mr-1">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
            <p className="text-white text-[11px] md:text-sm leading-tight drop-shadow-md">{currentQuest.title}</p>
            <p className="text-[#ddc1ae]/70 text-[9px] md:text-[10px] mt-1 leading-tight">{currentQuest.desc}</p>
          </div>
        </div>
      )}

      {isNearNpc && !showChat && !isWasted && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 md:-translate-x-[calc(50%-128px)] bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-sm font-bold tracking-widest text-slate-200 animate-pulse z-20 pointer-events-none">
          📢 Tekan AKSI untuk bicara dengan <span className="text-orange-400">{activeNpcName}</span>
        </div>
      )}

      {!showChat && !isWasted && (
        <div className="absolute bottom-8 right-8 flex items-center gap-4 z-30 pointer-events-auto">
          <div className="flex flex-col items-end">
            {isNearNpc && <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest animate-pulse mb-2">Interaksi Tersedia</span>}
            <button 
              onPointerDown={openAction} 
              className={`w-24 h-24 ${isNearNpc ? 'bg-orange-500 hover:bg-orange-600 border-orange-400' : 'bg-white/10 hover:bg-white/20 border-white/20 backdrop-blur-md opacity-50'} rounded-full border-8 shadow-2xl flex items-center justify-center text-white font-black text-xl active:scale-90 transition-transform uppercase`}
            >
              AKSI
            </button>
          </div>
        </div>
      )}

      {/* CHAT DIALOG OVERLAY (Frosted Glass) */}
      {showChat && !isWasted && (
        <div className={`fixed inset-0 ${isSidebarOpen ? 'md:pl-64' : ''} transition-all duration-300 flex items-center justify-center z-[70] p-4 pointer-events-auto font-mono`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeChatDialog} onPointerDown={closeChatDialog}></div>
          <div className="w-full max-w-[800px] bg-[#1a1a1a]/95 backdrop-blur-2xl rounded-3xl border border-orange-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col p-6 md:p-8 overflow-hidden relative max-h-[90vh] overflow-y-auto">
            <button 
                onClick={closeChatDialog}
                onPointerDown={closeChatDialog}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all border border-transparent hover:border-red-500/30"
            >
                <span className="material-symbols-outlined font-bold text-lg">close</span>
            </button>
            
            {(() => {
              const reqMap: Record<string, string> = {
                 "prajurit": "kijaga",
                 "dalang": "prajurit",
                 "syahbandar": "dalang",
                 "arsitek": "syahbandar"
              };
              const prevId = reqMap[activeNpcId];
              if (prevId && !completedNpcs.includes(prevId)) {
                 const prevName = NPC_QUIZ[prevId as keyof typeof NPC_QUIZ]?.name || prevId;
                 return (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-lg shadow-[inset_0_-2px_10px_rgba(0,0,0,0.3)]">🔒</div>
                        <div className="flex-1">
                          <h2 className="text-red-500 font-bold text-lg md:text-xl uppercase tracking-widest">{activeNpcName}</h2>
                          <div className="h-px w-full bg-gradient-to-r from-red-500/50 to-transparent mt-1"></div>
                        </div>
                      </div>
                      <p className="text-lg md:text-xl text-slate-200 leading-relaxed my-6 md:my-8 italic font-serif text-center px-4">
                        "Maaf pengembara, kamu harus menyelesaikan urusan dengan <b>{prevName}</b> terlebih dahulu sebelum berbicara denganku."
                      </p>
                      <button 
                        onClick={closeChatDialog}
                        onPointerDown={closeChatDialog}
                        className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all hover:scale-[1.01] active:scale-95 uppercase tracking-widest text-red-400/90 shadow-sm"
                      >
                        Kembali
                      </button>
                    </div>
                 );
              }

              if (completedNpcs.includes(activeNpcId)) {
                return (
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-lg shadow-[inset_0_-2px_10px_rgba(0,0,0,0.3)]">✔️</div>
                      <div className="flex-1">
                        <h2 className="text-orange-500 font-bold text-lg md:text-xl uppercase tracking-widest">{activeNpcName}</h2>
                        <div className="h-px w-full bg-gradient-to-r from-orange-500/50 to-transparent mt-1"></div>
                      </div>
                    </div>

                    {completedDialogView === "options" ? (
                      <div className="flex flex-col gap-3 my-4">
                          <div className="bg-[#1e2235] border border-[#564334] shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] rounded-2xl p-4 md:p-5 mb-2 relative overflow-hidden">
                             <p className="text-sm md:text-base text-[#ddc1ae] leading-relaxed italic font-serif text-center relative z-10">
                               "{activeNpcId === 'kijaga' ? 'Selamat datang kembali, pengembara! Izin masukmu sudah tercatat.' : 
                                 activeNpcId === 'prajurit' ? 'Selamat datang kembali, pahlawan! Batumu sangat berguna untuk fondasi masjid.' :
                                 activeNpcId === 'arsitek' ? 'Selamat datang kembali! Masjid ini hampir tegak berdiri berkat bantuanmu.' :
                                 activeNpcId === 'syahbandar' ? 'Ah, pengembara! Emasmu sudah tersalurkan dengan baik.' :
                                 activeNpcId === 'dalang' ? 'Salam rahayu, pengembara. Saka Tatal dari Sunan Kalijaga berkat laku lampahmu.' :
                                 activeNpcId === 'kakek_rawa' ? 'Lahan basah ini semakin hijau berkat kepedulianmu, anak muda. Jaga terus alam ini.' :
                                 'Selamat datang kembali, pengembara! Bantuanmu sebelumnya sangat berarti bagi kami.'}"
                             </p>
                          </div>
                          
                          <button 
                            onClick={() => { playSound.click(); setCompletedDialogView("whats_new"); }}
                            className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 hover:border-orange-500/50 border border-white/10 rounded-2xl text-left text-base font-bold transition-all hover:scale-[1.02] active:scale-95 text-slate-200"
                          >
                            <span className="text-orange-500 mr-2">🗣️</span> Apa kabar?
                          </button>
                          
                          <button 
                            onClick={() => { playSound.click(); setCompletedDialogView("progress"); }}
                            className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 border border-white/10 rounded-2xl text-left text-base font-bold transition-all hover:scale-[1.02] active:scale-95 text-slate-200"
                          >
                            <span className="text-emerald-500 mr-2">📈</span> Cek progres saya
                          </button>
                          
                          {NPC_QUIZ[activeNpcId as keyof typeof NPC_QUIZ]?.extraDialogue && (
                            <button 
                              onClick={() => { 
                                playSound.click();
                                const extra = NPC_QUIZ[activeNpcId as keyof typeof NPC_QUIZ]?.extraDialogue;
                                if (extra?.text === "TOGGLE_CORTISOL") {
                                    const isCortisolActive = completedNpcs.includes("tikar");
                                    const newCompleted = isCortisolActive 
                                        ? completedNpcs.filter(id => id !== "tikar") 
                                        : [...completedNpcs, "tikar"];
                                    setCompletedNpcs(newCompleted);
                                    syncStateToFirebase({ completedNpcs: newCompleted });
                                    closeChatDialog();
                                    if (!isCortisolActive) {
                                        setShowAchievement(true);
                                    }
                                } else {
                                    setCompletedDialogView("extra"); 
                                }
                              }}
                              className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 border border-white/10 rounded-2xl text-left text-base font-bold transition-all hover:scale-[1.02] active:scale-95 text-slate-200"
                            >
                              <span className="text-blue-500 mr-2">ℹ️</span> 
                              {NPC_QUIZ[activeNpcId as keyof typeof NPC_QUIZ]?.extraDialogue?.text === "TOGGLE_CORTISOL" 
                                  ? (completedNpcs.includes("tikar") ? "Nonaktifkan Mode Low Cortisol" : "Aktifkan Mode Low Cortisol") 
                                  : NPC_QUIZ[activeNpcId as keyof typeof NPC_QUIZ]?.extraDialogue?.label}
                            </button>
                          )}
                      </div>
                    ) : completedDialogView === "progress" ? (
                      <div className="bg-[#1e2235] border-2 border-[#564334] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] rounded-2xl p-4 md:p-6 mb-6 my-4 relative overflow-hidden">
                         <span className="material-symbols-outlined absolute top-2 left-2 text-[#564334] opacity-20 text-6xl pointer-events-none">format_quote</span>
                         <p className="text-lg md:text-xl text-[#ddc1ae] leading-relaxed italic font-serif text-center relative z-10">
                            {inventory.includes("Surya Majapahit") || appState === "victory" 
                              ? `"Kamu sudah selesai! Selamat dan terimakasih telah berjuang membangun Masjid Agung Demak yang kokoh. Perjuanganmu tidak akan dilupakan!"`
                              : `"Progres pembangunan Masjid Agung Demak saat ini mencapai ${Math.round((inventory.filter(i => ["Batu Karang", "Kayu Jati", "Saka Tatal", "Dana Emas"].includes(i)).length / 4) * 100)}%. ${(inventory.filter(i => ["Batu Karang", "Kayu Jati", "Saka Tatal", "Dana Emas"].includes(i)).length >= 4) ? 'Semua bahan sudah lengkap! Bicaralah dengan Arsitek.' : 'Kumpulkan sisa bahan dari penduduk di sekitar sini.'}"`
                            }
                         </p>
                      </div>
                    ) : completedDialogView === "extra" ? (
                      <div className="bg-[#1e2235] border-2 border-[#564334] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] rounded-2xl p-4 md:p-6 mb-6 my-4 relative overflow-hidden">
                         <span className="material-symbols-outlined absolute top-2 left-2 text-[#564334] opacity-20 text-6xl pointer-events-none">format_quote</span>
                         <p className="text-lg md:text-xl text-[#ddc1ae] leading-relaxed italic font-serif text-center px-4 relative z-10">"{NPC_QUIZ[activeNpcId as keyof typeof NPC_QUIZ]?.extraDialogue?.text}"</p>
                      </div>
                    ) : (
                      <div className="bg-[#181a2a] border border-[#564334]/50 shadow-xl rounded-2xl p-0 mb-6 my-4 relative overflow-hidden flex flex-col sm:flex-row items-stretch">
                         {/* Left Column - Meta & Decorative */}
                         <div className="bg-[#1e2235] w-full sm:w-1/3 p-4 sm:p-6 flex flex-col justify-center items-center sm:items-start border-b sm:border-b-0 sm:border-r border-[#564334]/50 relative z-10 shrink-0">
                            <div className="w-12 h-12 bg-orange-900/30 rounded-full flex items-center justify-center mb-3 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(234,88,12,0.2)]">
                               <span className="material-symbols-outlined">newspaper</span>
                            </div>
                            <h3 className="text-[#ffb77d] font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1.5 text-center sm:text-left drop-shadow-md">Kabar Terbaru</h3>
                            <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-1.5 text-[10px] lg:text-xs font-mono text-slate-400 w-full justify-center sm:justify-start">
                               <span className="flex items-center gap-1.5 line-clamp-1"><span className="material-symbols-outlined text-[13px]">person</span>{activeNpcName}</span>
                               <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="material-symbols-outlined text-[13px]">calendar_today</span>Abad Ke-15 M</span>
                            </div>
                         </div>
                         
                         {/* Right Column - Content */}
                         <div className="w-full sm:w-2/3 p-5 sm:p-6 lg:p-8 relative flex items-center bg-gradient-to-br from-[#1A1C2C] to-[#181a2a]">
                            <span className="material-symbols-outlined absolute top-4 right-4 text-[#564334] opacity-20 text-5xl sm:text-7xl pointer-events-none transform rotate-180">format_quote</span>
                            <div className="relative z-10 w-full mt-2 sm:mt-0">
                               <p className="text-sm sm:text-base lg:text-lg text-[#e1e1f7] leading-relaxed font-serif italic text-center sm:text-left drop-shadow-sm">
                                  "{NPC_QUIZ[activeNpcId as keyof typeof NPC_QUIZ]?.completedText}"
                               </p>
                            </div>
                         </div>
                      </div>
                    )}
                    
                    <button 
                      onClick={completedDialogView === "options" ? closeChatDialog : () => { playSound.click(); setCompletedDialogView("options"); }}
                      className="mt-auto w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all hover:scale-[1.01] active:scale-95 uppercase tracking-widest text-orange-400/90 shadow-sm"
                    >
                      {completedDialogView === "options" ? "Tutup" : "Kembali"}
                    </button>
                  </div>
                );
              }

              return (
                <div className="relative flex-1 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-lg shadow-inner border border-slate-600 shrink-0">🗣️</div>
                      <div>
                        <h2 className="text-orange-500 font-bold text-lg md:text-xl uppercase tracking-widest">
                          {activeNpcName}
                        </h2>
                        <div className="h-px w-full bg-gradient-to-r from-orange-500/50 to-transparent mt-1"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-black/40 px-3 py-2 rounded-xl border border-white/5 shrink-0 self-start sm:self-auto shadow-inner w-full sm:w-auto overflow-x-auto">
                       {Array.from({length: 5}).map((_, i) => {
                          const isPast = i < currentQuestionIndex;
                          const isCurrent = i === currentQuestionIndex;
                          
                          return (
                            <div 
                               key={i} 
                               className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded flex items-center justify-center text-[10px] md:text-xs font-bold transition-all duration-300 shrink-0 ${
                                  isPast ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 
                                  isCurrent ? 'bg-orange-500/20 text-orange-400 border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse scale-110' : 
                                  'bg-white/5 text-slate-500 border border-white/10'
                               }`}
                            >
                               {isPast ? <span className="material-symbols-outlined text-[14px]">check</span> : i + 1}
                            </div>
                          )
                       })}
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-2xl p-4 md:p-6 mb-6 border border-white/5 shadow-inner">
                     <p className="text-lg md:text-xl text-slate-100 leading-relaxed italic font-serif">"{NPC_QUIZ[activeNpcId as keyof typeof NPC_QUIZ]?.questions?.[currentQuestionIndex]?.q || NPC_QUIZ[activeNpcId as keyof typeof NPC_QUIZ]?.completedText}"</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {NPC_QUIZ[activeNpcId as keyof typeof NPC_QUIZ]?.questions?.[currentQuestionIndex]?.choices?.map((choice, idx) => {
                        const isCorrect = idx === NPC_QUIZ[activeNpcId as keyof typeof NPC_QUIZ]?.questions[currentQuestionIndex].correctIdx;
                        const letters = ["A", "B", "C"];
                        return (
                            <button 
                                key={idx}
                                onClick={() => handlePilihJawaban(idx, isCorrect)}
                                className="py-3 px-6 bg-white/5 hover:bg-white/20 hover:border-orange-500/50 border border-white/10 rounded-xl text-left text-base font-bold transition-all hover:scale-[1.02] active:scale-95 group text-slate-200"
                            >
                                <span className="text-orange-500 group-hover:text-white mr-2">[{letters[idx]}]</span> {choice}
                            </button>
                        );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* QUEST COMPLETE CELEBRATORY BANNER */}
      {recentReward && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center p-4">
            <div className="w-full max-w-sm md:max-w-md bg-gradient-to-br from-green-500/90 to-emerald-700/90 backdrop-blur-md rounded-2xl border-2 border-emerald-300/50 p-6 flex flex-col items-center text-center shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-[popIn_0.5s_ease-out_forwards]">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl md:text-5xl mb-3 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] animate-pulse">
                  {INVENTORY_DETAILS[recentReward.itemReward]?.icon || "⭐"}
               </div>
               <h3 className="text-white font-black text-xl md:text-2xl uppercase tracking-widest mb-1 drop-shadow-md">
                 {recentReward.npcName === "Area Memancing" ? "Tangkapan Berhasil!" : "Kuis Diselesaikan!"}
               </h3>
               <p className="text-emerald-100/90 text-sm md:text-base italic mb-3">
                 {recentReward.npcName === "Area Memancing" ? "Kau mendapatkan sesuatu dari sungai." : `${recentReward.npcName} terkesan dengan pengetahuanmu.`}
               </p>
               <div className="bg-black/30 w-full rounded-xl py-3 px-4 flex flex-col border border-black/20">
                 <span className="text-xs md:text-sm text-white/50 uppercase tracking-widest mb-0.5">Hadiah Baru</span>
                 <span className="text-white font-bold text-lg md:text-xl text-orange-200">
                   {recentReward.itemReward}
                 </span>
               </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes popIn {
                0% { opacity: 0; transform: translateY(-30px) scale(0.9); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}} />
        </div>
      )}

      {/* D-PAD HUD */}
      {!showChat && !isWasted && (
      <>
        <div className={`absolute bottom-8 left-8 ${isSidebarOpen ? 'md:left-[280px]' : 'md:left-8'} transition-all duration-300 flex flex-col items-center z-20 pointer-events-auto`}>
          <div className="grid grid-cols-3 gap-1 opacity-60">
            <div />
            <button onPointerDown={() => moveState.current.up = true} onPointerUp={() => moveState.current.up = false} onPointerLeave={() => moveState.current.up = false} 
                    className="w-12 h-12 bg-white/10 backdrop-blur-md rounded border border-white/20 flex items-center justify-center text-xl hover:bg-white/20 active:scale-95 transition-all outline-none">
              <span className="material-symbols-outlined select-none pointer-events-none">arrow_upward</span>
            </button>
            <div />
            <button onPointerDown={() => moveState.current.left = true} onPointerUp={() => moveState.current.left = false} onPointerLeave={() => moveState.current.left = false} 
                    className="w-12 h-12 bg-white/10 backdrop-blur-md rounded border border-white/20 flex items-center justify-center text-xl hover:bg-white/20 active:scale-95 transition-all outline-none">
              <span className="material-symbols-outlined select-none pointer-events-none">arrow_back</span>
            </button>
            <button onPointerDown={() => moveState.current.down = true} onPointerUp={() => moveState.current.down = false} onPointerLeave={() => moveState.current.down = false} 
                    className="w-12 h-12 bg-white/10 backdrop-blur-md rounded border border-white/20 flex items-center justify-center text-xl hover:bg-white/20 active:scale-95 transition-all outline-none">
              <span className="material-symbols-outlined select-none pointer-events-none">arrow_downward</span>
            </button>
            <button onPointerDown={() => moveState.current.right = true} onPointerUp={() => moveState.current.right = false} onPointerLeave={() => moveState.current.right = false} 
                    className="w-12 h-12 bg-white/10 backdrop-blur-md rounded border border-white/20 flex items-center justify-center text-xl hover:bg-white/20 active:scale-95 transition-all outline-none">
              <span className="material-symbols-outlined select-none pointer-events-none">arrow_forward</span>
            </button>
          </div>
        </div>
        
        {/* CONSTRUCTION METER */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-[60%] max-w-sm pointer-events-none hidden md:block">
          <div className="bg-[#323445] border-4 border-[#a48c7a] p-1.5 flex gap-1 shadow-lg">
            <div className={`flex-1 h-3 transition-colors ${(inventory.includes('Batu Karang') || inventory.includes('Surya Majapahit')) ? 'bg-[#37946E]' : 'bg-[#29366F]'}`}></div>
            <div className={`flex-1 h-3 transition-colors ${(inventory.includes('Kayu Jati') || inventory.includes('Surya Majapahit')) ? 'bg-[#37946E]' : 'bg-[#29366F]'}`}></div>
            <div className={`flex-1 h-3 transition-colors ${(inventory.includes('Saka Tatal') || inventory.includes('Surya Majapahit')) ? 'bg-[#37946E]' : 'bg-[#29366F]'}`}></div>
            <div className={`flex-1 h-3 transition-colors ${(inventory.includes('Dana Emas') || inventory.includes('Surya Majapahit')) ? 'bg-[#37946E]' : 'bg-[#29366F]'}`}></div>
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="font-mono text-[10px] text-[#ddc1ae] uppercase tracking-widest font-bold">Fondasi</span>
            <span className="font-mono text-[10px] text-[#ddc1ae] uppercase tracking-widest font-bold">Dana</span>
          </div>
        </div>
      </>
      )}

      {/* FISHING MINI-GAME OVERLAY */}
      {showFishing && (
        <div className={`fixed inset-0 ${isSidebarOpen ? 'md:pl-64' : ''} transition-all duration-300 z-[70] bg-black/80 backdrop-blur-sm pointer-events-auto flex items-center justify-center p-4`}>
           <div className="bg-[#1e2235] border-2 border-[#564334] rounded-2xl p-6 shadow-2xl max-w-sm w-full flex flex-col items-center animate-[slideDown_0.3s_ease-out_forwards] relative">
              <button 
                onClick={() => { playSound.click(); setShowFishingTutorial(true); }} 
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#323445] hover:bg-emerald-600 border border-[#564334] flex items-center justify-center text-slate-300 transition-colors"
                title="Bantuan Memancing"
              >
                 <span className="material-symbols-outlined text-sm">help</span>
              </button>
              <h2 className="text-2xl font-black text-[#ffb77d] uppercase tracking-widest mb-4 font-mono">Memancing</h2>
              
              {/* Fish animation or status */}
              <div className="w-full h-48 bg-[#101222] border-2 border-[#323445] rounded-xl flex items-center justify-center mb-6 relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] mt-2">
                 {fishingState === "idle" && <span className="text-4xl text-white">🎣</span>}
                 {fishingState === "waiting" && <span className="text-4xl animate-bounce text-white">⏳</span>}
                 {fishingState === "catching" && <span className={`text-4xl transition-all ${fishProgress >= 90 ? (fishHoldTime > 20 ? 'animate-[bounce_0.1s_infinite] scale-125 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]' : 'animate-[bounce_0.2s_infinite] scale-110') : 'animate-[spin_0.5s_linear_infinite] scale-90 opacity-80'} text-white`}>🐟</span>}
                 {fishingState === "success" && (
                    <div className="relative flex items-center justify-center animate-[fishPop_0.6s_ease-out_forwards]">
                       <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping z-0 blur-md"></div>
                       {[...Array(8)].map((_, i) => (
                           <div key={i} className="absolute w-3 h-3 bg-cyan-300/80 rounded-full animate-[splashParticle_0.6s_ease-out_forwards] z-10" style={{ '--tx': `${Math.cos(i * 45 * Math.PI / 180) * 60}px`, '--ty': `${Math.sin(i * 45 * Math.PI / 180) * 60 - 30}px`, opacity: 0 } as React.CSSProperties} />
                       ))}
                       <span className="text-6xl drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] text-white relative z-20">🐠</span>
                    </div>
                 )}
                 {fishingState === "fail" && <span className="text-4xl grayscale text-white">🦴</span>}
                 
                 {/* Progress bar if catching */}
                 {fishingState === "catching" && (
                    <div className="absolute inset-x-4 bottom-2 flex flex-row gap-2 items-center justify-between">
                       <span className={`text-[9px] uppercase tracking-widest font-bold leading-none bg-black/50 px-2 py-1 rounded backdrop-blur-md shrink-0 transition-colors ${fishProgress >= 90 ? 'text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.8)]' : 'text-white/50'}`}>
                         {fishHoldTime > 20 ? 'HAMPIR!' : (fishProgress >= 90 ? 'TAHAN!' : 'Tarik ke area hijau!')}
                       </span>
                       {/* Tension Bar */}
                       <div className="w-full h-5 bg-black/60 rounded-full border border-white/20 overflow-hidden box-content relative flex items-center shadow-inner flex-1 mx-2">
                          <div className="absolute top-0 bottom-0 left-[90%] right-0 bg-green-500/40 border-l border-green-400"></div>
                          <div className="h-full transition-all duration-200" style={{ width: `${fishProgress}%`, backgroundColor: fishProgress >= 90 ? '#34d399' : '#ff8c00' }}></div>
                       </div>
                       {/* Catch Progress Bar */}
                       <div className="w-12 h-3 bg-black/50 rounded-full border border-emerald-500/30 overflow-hidden box-content shrink-0">
                          <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${(fishHoldTime / 30) * 100}%` }}></div>
                       </div>
                    </div>
                 )}
              </div>
              
              {fishingState === "idle" && (
                 <button disabled={fishCooldown} onClick={() => { playSound.click(); setFishingState("waiting"); setTimeout(() => { if(showFishingRef.current) setFishingState("catching"); }, 1500 + Math.random() * 2000); }} className={`w-full font-mono text-white font-bold py-4 rounded-xl uppercase tracking-widest active:scale-95 transition-transform ${fishCooldown ? 'bg-slate-600 border border-slate-500 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-500 border border-blue-400 shadow-[0_4px_0_rgba(30,58,138,1)] active:shadow-none active:translate-y-1'}`}>{fishCooldown ? "Menunggu..." : "Lempar Kail"}</button>
              )}
              {fishingState === "waiting" && (
                 <div className="text-slate-400 font-mono text-sm uppercase tracking-widest animate-pulse h-12 flex items-center justify-center">Menunggu Ikan...</div>
              )}
              {fishingState === "catching" && (
                 <button onClick={() => { playSound.click(); setFishProgress(p => Math.min(100, p + 15)); }} className="w-full bg-orange-600 hover:bg-orange-500 border border-orange-400 font-mono text-white font-bold py-4 rounded-xl uppercase tracking-widest active:scale-95 transition-transform text-xl h-20 shadow-[0_4px_0_rgba(154,52,18,1)] active:shadow-none active:translate-y-1">TARIK!</button>
              )}
              {(fishingState === "success" || fishingState === "fail") && (
                 <div className={`flex flex-col gap-3 w-full font-mono ${fishingState === 'success' ? 'animate-[fadeInDelay_0.5s_ease-out_0.8s_both]' : ''}`}>
                    <div className={`text-center font-bold uppercase tracking-widest mb-2 ${fishingState === "success" ? 'text-emerald-400' : 'text-red-400'}`}>
                       {fishingState === "success" ? "Berhasil!" : "Terlepas..."}
                    </div>
                    {fishingState === "success" ? (
                        <button onClick={() => { 
                            playSound.click(); 
                            const reward = NPC_QUIZ.mancing.itemReward;
                            setRecentReward({ npcName: "Area Memancing", itemReward: reward });
                            setTimeout(() => setRecentReward(null), 5000);
                            const newInv = inventory.includes(reward) ? inventory : [...inventory, reward];
                            if (!completedNpcs.includes("mancing")) {
                                const newCompleted = [...completedNpcs, "mancing"];
                                setCompletedNpcs(newCompleted);
                                syncStateToFirebase({ inventory: newInv, completedNpcs: newCompleted });
                            } else {
                                syncStateToFirebase({ inventory: newInv });
                            }
                            setInventory(newInv);
                            setFishingState("idle"); 
                            setFishProgress(50); 
                            setFishHoldTime(0);
                            setShowFishing(false); 
                        }} 
                        className="w-full bg-[#323445] hover:bg-[#564334] text-white font-bold py-3 rounded-xl uppercase tracking-widest transition-all shadow-[0_2px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none border border-white/10">Ambil & Tutup</button>
                    ) : (
                        <div className="flex flex-row gap-2 w-full">
                            <button disabled={fishCooldown} onClick={() => { 
                                playSound.click();
                                setFishingState("idle"); 
                                setFishProgress(50); 
                                setFishHoldTime(0);
                            }} 
                            className={`flex-1 text-white font-bold py-3 rounded-xl uppercase tracking-widest transition-all border border-white/10 ${fishCooldown ? 'bg-slate-600 cursor-not-allowed opacity-80 shadow-none' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_2px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none'}`}>
                                {fishCooldown ? "..." : "Coba Lagi"}
                            </button>
                            <button onClick={() => { 
                                playSound.click();
                                setFishingState("idle"); 
                                setFishProgress(50); 
                                setFishHoldTime(0);
                                setShowFishing(false); 
                            }} 
                            className="flex-1 bg-[#323445] hover:bg-[#564334] text-white font-bold py-3 rounded-xl uppercase tracking-widest transition-all shadow-[0_2px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none border border-white/10">Tutup</button>
                        </div>
                    )}
                 </div>
              )}
           </div>
           
           <style dangerouslySetInnerHTML={{__html: `
              @keyframes fishPop {
                0% { transform: scale(0.1) translateY(100px) rotate(-45deg); opacity: 0; }
                60% { transform: scale(1.2) translateY(-20px) rotate(10deg); opacity: 1; }
                80% { transform: scale(0.9) translateY(5px) rotate(-5deg); }
                100% { transform: scale(1) translateY(0) rotate(0); opacity: 1; }
              }
              @keyframes splashParticle {
                0% { transform: translate(0, 0) scale(1); opacity: 1; }
                100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
              }
              @keyframes fadeInDelay {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
              }
           `}} />
        </div>
      )}

      {/* FISHING TUTORIAL OVERLAY */}
      {showFishingTutorial && (
         <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer pointer-events-auto" onClick={() => { playSound.click(); setShowFishingTutorial(false); }}>
            <div className="bg-[#1A1C2C] border-2 border-[#ffb77d] rounded-2xl p-6 shadow-2xl max-w-sm w-full font-mono text-center flex flex-col items-center gap-4 cursor-default animate-[scaleIn_0.2s_ease-out_forwards]" onClick={e => e.stopPropagation()}>
                <span className="material-symbols-outlined text-5xl text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">phishing</span>
                <h3 className="text-xl font-black text-white uppercase tracking-widest text-[#ffb77d]">Cara Memancing</h3>
                
                <div className="text-xs text-slate-300 text-left space-y-3 mt-2 pr-2 overflow-y-auto max-h-[50vh] w-full">
                    <p><span className="text-blue-400 font-bold block mb-0.5">1. Lempar Kail</span>Tunggu hingga umpan disambar ikan.</p>
                    <p><span className="text-orange-400 font-bold block mb-0.5">2. Tarik</span>Tekan tombol <b className="text-white">TARIK!</b> berulang-ulang untuk menaikkan indikator ikan.</p>
                    <p><span className="text-emerald-400 font-bold block mb-0.5">3. Area Hijau</span>Usahakan agar ikan berada di <b>Area Hijau</b> pada bar untuk meningkatkan peluang tangkapan!</p>
                    <p><span className="text-emerald-500 font-bold block mb-0.5">4. Tahan</span>Ketika ikan berada tetap di area hijau, tulisan akan berubah menjadi <b className="text-emerald-400">TAHAN!</b> dan bar hijau kecil (progress tangkapan) akan terisi perlahan. Penuhi hingga full!</p>
                    <p><span className="text-red-400 font-bold block mb-0.5">5. Gagal</span>Jika bar indikator ikan sampai 0 (habis) karena tidak ditarik, tangkapan akan terlepas.</p>
                </div>
                
                <button 
                  onClick={() => { playSound.click(); setShowFishingTutorial(false); }} 
                  className="w-full bg-[#323445] hover:bg-[#564334] text-white font-bold py-3 mt-4 rounded-xl uppercase tracking-widest transition-all shadow-[0_2px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none border border-white/10"
                >
                  Mengerti
                </button>
            </div>
         </div>
      )}

      {/* MAP OVERLAY */}
      {showMap && (
        <div className={`fixed inset-0 ${isSidebarOpen ? 'md:pl-64' : ''} transition-all duration-300 z-[60] bg-black/60 backdrop-blur-sm pointer-events-auto font-mono flex items-center justify-center p-4`}>
          <div 
             className="absolute inset-0 bg-[radial-gradient(#1c1e2f_1px,transparent_1px)] [background-size:4px_4px] opacity-30" 
             onClick={() => { playSound.click(); setShowMap(false); }}
             onPointerDown={() => { playSound.click(); setShowMap(false); }}
          ></div>
          
          <section className="relative w-[90%] sm:w-[80%] md:w-[70%] max-w-3xl bg-[#1A1C2C] border-2 md:border-4 border-[#564334] rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,0.6)] flex flex-col pointer-events-auto animate-[slideDown_0.3s_ease-out_forwards]">
            {/* Header */}
            <div className="bg-[#323445] border-b-2 md:border-b-4 border-[#564334] p-2 md:p-4 flex justify-between items-center relative">
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <span className="material-symbols-outlined text-[#ffb77d] text-lg md:text-3xl">map</span>
                <h2 className="text-[#ffb77d] text-[10px] md:text-lg uppercase tracking-widest font-black leading-tight">Peta Bintoro</h2>
              </div>
              <button 
                  onClick={() => { playSound.click(); setShowMap(false); }}
                  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-[#1A1C2C] hover:bg-red-900 border-2 border-[#564334] hover:border-red-500 text-[#ddc1ae] hover:text-white transition-colors group cursor-pointer"
              >
                 <span className="material-symbols-outlined text-sm md:text-base group-hover:scale-110 transition-transform">close</span>
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 md:p-6 bg-[#181a2a] relative overflow-auto flex flex-col items-center max-h-[70vh]">
              <div 
                  className="relative w-full min-w-[600px] sm:min-w-[700px] aspect-[50/30] max-w-full bg-[#1e2235] border-2 border-[#564334]/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                  onClick={() => setSelectedMapNpc(null)}
              >
                 {/* NPCs */}
                 {(() => {
                    const npcs = [
                        {id: "kijaga", label: "Ki Jaga", x: 24, y: 26, c: "bg-[#8c5a32]", icon: "account_balance"},
                        {id: "prajurit", label: "Veteran", x: 22, y: 24, c: "bg-red-500", icon: "shield"},
                        {id: "arsitek", label: "Arsitek", x: 35, y: 15, c: "bg-amber-500", icon: "architecture"},
                        {id: "dalang", label: "Dalang", x: 12, y: 6, c: "bg-purple-500", icon: "theater_comedy"},
                        {id: "syahbandar", label: "Syahbandar", x: 15, y: 6, c: "bg-blue-500", icon: "sailing"},
                        {id: "kangchill", label: "Kang Chill", x: 6, y: 24, c: "bg-emerald-500", icon: "self_improvement"},
                        {id: "tikar", label: "Tikar Santai", x: 5, y: 24, c: "bg-teal-500", icon: "weekend"},
                        {id: "mancing", label: "Area Memancing", x: 14, y: 24, c: "bg-cyan-500", icon: "phishing"},
                        {id: "kakek_rawa", label: "Kakek Rawa", x: 45, y: 20, c: "bg-[#556B2F]", icon: "nature_people"}
                    ];
                    return npcs.map((n, i) => {
                       const completed = completedNpcs.includes(n.id);
                       return (
                         <div 
                            key={i} 
                            className={`absolute flex flex-col items-center z-30 cursor-pointer transition-all hover:z-40 ${selectedMapNpc === n.id ? 'z-50' : ''} ${completed ? '' : 'animate-bounce'}`} 
                            style={{ left: `${(n.x / 50) * 100}%`, top: `${(n.y / 30) * 100}%`, transform: 'translate(-50%, -50%)' }}
                            onClick={(e) => { e.stopPropagation(); playSound.click(); setSelectedMapNpc(selectedMapNpc === n.id ? null : n.id); }}
                         >
                              <div className={`w-5 h-5 md:w-8 md:h-8 rounded-full border-2 ${selectedMapNpc === n.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e2235]' : ''} ${completed ? 'bg-slate-500 border-slate-400' : `${n.c} border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]`} flex items-center justify-center shadow-lg relative`}>
                                 {!completed && <div className={`absolute inset-0 rounded-full ${n.c} opacity-50 animate-ping`}></div>}
                                 <span className="material-symbols-outlined text-[10px] md:text-[14px] text-white leading-none relative z-10">{n.icon}</span>
                              </div>
                              <span className="hidden md:block text-[9px] md:text-[10px] text-white/80 mt-1 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded-md border border-white/20 uppercase tracking-widest font-bold shadow-sm">{n.label}</span>
                              
                              {/* Selected Tooltip */}
                              {selectedMapNpc === n.id && (
                                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max max-w-[200px] bg-[#323445] border-2 border-[#ddc1ae] rounded-lg shadow-2xl p-3 z-50">
                                      <div className="text-center font-bold text-[#ffb77d] text-sm uppercase tracking-widest border-b border-[#ddc1ae]/30 pb-2 mb-2">{n.label}</div>
                                      <div className="text-xs text-[#e1e1f7] text-center leading-relaxed">
                                          {completed ? "Status: Quest Selesai" : (NPC_QUIZ[n.id]?.itemReward ? `Quest: Dapatkan ${NPC_QUIZ[n.id]?.itemReward}` : "Status: Belum Dieksplorasi")}
                                      </div>
                                  </div>
                              )}
                         </div>
                       );
                    });
                 })()}

                 {/* Player */}
                 {appState === "open_world" && (
                     <div className="absolute flex flex-col items-center z-20 transition-all duration-300" style={{ left: `${Math.min(49, Math.max(1, playerGridPos.x)) / 50 * 100}%`, top: `${Math.min(29, Math.max(1, playerGridPos.y)) / 30 * 100}%`, transform: 'translate(-50%, -50%)' }}>
                         <div className="w-8 h-8 md:w-10 md:h-10 bg-[#2d5a27]/90 backdrop-blur-sm rounded-full border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse flex items-center justify-center relative overflow-hidden">
                            {playerAvatar ? (
                               <img src={playerAvatar} className="w-full h-full object-cover" />
                            ) : (
                               <span className="material-symbols-outlined text-white text-[14px] md:text-[16px]">my_location</span>
                            )}
                         </div>
                         <span className="text-[10px] md:text-[12px] text-emerald-300 font-bold mt-1.5 bg-black/80 px-2 py-0.5 rounded-md backdrop-blur-md whitespace-nowrap border border-emerald-500/50 font-sans tracking-wide shadow-lg">
                           KAMU DI SINI
                         </span>
                     </div>
                 )}
                 {appState === "game" && (
                     <div className="absolute flex flex-col items-center z-20 transition-all duration-300" style={{ left: '50%', top: '90%', transform: 'translate(-50%, -50%)' }}>
                         <div className="w-8 h-8 md:w-10 md:h-10 bg-[#2d5a27]/90 rounded-full border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] flex items-center justify-center animate-pulse overflow-hidden">
                            {playerAvatar ? (
                               <img src={playerAvatar} className="w-full h-full object-cover" />
                            ) : (
                               <span className="material-symbols-outlined text-white text-[14px] md:text-[16px]">my_location</span>
                            )}
                         </div>
                         <span className="text-[10px] md:text-[12px] text-emerald-300 font-bold mt-1.5 bg-black/80 px-2 py-0.5 rounded-md backdrop-blur-md whitespace-nowrap border border-emerald-500/50 font-sans tracking-wide shadow-lg">
                           GERBANG KERAJAAN
                         </span>
                     </div>
                 )}
              </div>

              <div className="w-full flex gap-3 md:gap-5 mt-6 justify-center flex-wrap pt-4 border-t border-[#564334]/30">
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#2d5a27] border border-emerald-400 rounded"></div><span className="text-[10px] md:text-xs text-[#ddc1ae] uppercase tracking-wider">Posisimu</span></div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#8c5a32] rounded-full border border-white/50"></div><span className="text-[10px] md:text-xs text-[#ddc1ae] uppercase tracking-wider">Gate</span></div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-full border border-white/50"></div><span className="text-[10px] md:text-xs text-[#ddc1ae] uppercase tracking-wider">Veteran</span></div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-amber-500 rounded-full border border-white/50"></div><span className="text-[10px] md:text-xs text-[#ddc1ae] uppercase tracking-wider">Arsitek</span></div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-purple-500 rounded-full border border-white/50"></div><span className="text-[10px] md:text-xs text-[#ddc1ae] uppercase tracking-wider">Dalang</span></div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded-full border border-white/50"></div><span className="text-[10px] md:text-xs text-[#ddc1ae] uppercase tracking-wider">Syahbandar</span></div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-500 rounded-full border border-white/50"></div><span className="text-[10px] md:text-xs text-[#ddc1ae] uppercase tracking-wider">Kang Chill</span></div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-teal-500 rounded-full border border-white/50"></div><span className="text-[10px] md:text-xs text-[#ddc1ae] uppercase tracking-wider">Tikar</span></div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-500 rounded-full border border-slate-400"></div><span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">Selesai</span></div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* AVATAR CONFIRM OVERLAY */}
      {showAvatarConfirm && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md pointer-events-auto font-mono flex items-center justify-center p-4">
          <div className="bg-[#1e2235] border-4 border-[#ffb77d] shadow-[0_0_50px_rgba(255,183,125,0.2)] max-w-md w-full relative z-10">
            <div className="bg-[#2a2e45] p-6 text-center border-b border-[#3a3e55]">
               <div className="w-20 h-20 mx-auto mb-4 border-2 border-[#ffb77d] rounded-sm overflow-hidden shadow-[0_0_15px_rgba(255,183,125,0.4)] bg-black/50">
                  {playerAvatar && <img src={playerAvatar} alt={playerName} className="w-full h-full object-cover" />}
               </div>
               <h3 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest drop-shadow-md">Ganti Karakter?</h3>
            </div>
            <div className="p-6">
               <p className="text-slate-300 text-sm md:text-base text-center leading-relaxed mb-8">
                  Apakah kamu benar-benar ingin mengganti avatar kamu? Kamu akan dibawa kembali ke layar pengaturan dan bisa melanjutkan permainan dari titik ini nanti.
               </p>
               <div className="flex gap-4">
                 <button 
                   onClick={() => { playSound.click(); setShowAvatarConfirm(false); }} 
                   className="flex-1 bg-slate-700 hover:bg-slate-600 border-2 border-slate-500 rounded p-3 text-white uppercase font-bold tracking-wider active:scale-95 transition-transform"
                 >
                   Batal
                 </button>
                 <button 
                   onClick={() => { 
                       playSound.click(); 
                       setShowAvatarConfirm(false);
                       changeAppState("setup"); 
                   }} 
                   className="flex-1 bg-orange-600 hover:bg-orange-500 border-2 border-orange-400 rounded p-3 text-white uppercase font-bold tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-95 transition-transform"
                 >
                   Lanjut
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* TUTORIAL OVERLAY */}
      {showTutorial && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md pointer-events-auto font-mono flex items-center justify-center p-4">
          <div className="bg-[#1e2235] border-4 border-[#ffb77d] shadow-[0_0_50px_rgba(255,183,125,0.3)] max-w-lg w-full relative z-10 flex flex-col md:flex-row overflow-hidden">
             
             {/* Left Icon Panel */}
             <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#ffb77d]/30 min-w-[140px]">
                <span className="material-symbols-outlined text-6xl text-white drop-shadow-lg mb-2">
                   {TUTORIAL_STEPS[tutorialStep].icon}
                </span>
                <span className="text-white/80 font-bold text-sm uppercase tracking-widest whitespace-nowrap">
                   Langkah {tutorialStep + 1} / {TUTORIAL_STEPS.length}
                </span>
             </div>

             {/* Right Content Panel */}
             <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                   <h3 className="text-xl md:text-2xl font-bold text-[#ffb77d] uppercase tracking-widest leading-tight mb-4 drop-shadow-md">
                      {TUTORIAL_STEPS[tutorialStep].title}
                   </h3>
                   <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
                      {TUTORIAL_STEPS[tutorialStep].desc}
                   </p>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                   {tutorialStep > 0 ? (
                      <button 
                         onClick={() => { playSound.click(); setTutorialStep(prev => prev - 1); }}
                         className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded border-2 border-slate-500 font-bold uppercase tracking-wider text-sm transition-all active:scale-95"
                      >
                         Kembali
                      </button>
                   ) : <div></div>}
                   
                   <button 
                      onClick={() => {
                         playSound.click();
                         if (tutorialStep < TUTORIAL_STEPS.length - 1) {
                            setTutorialStep(prev => prev + 1);
                         } else {
                            setShowTutorial(false);
                            syncStateToFirebase({ hasSeenTutorial: true });
                         }
                      }}
                      className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded border-2 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)] font-bold uppercase tracking-wider text-sm transition-all active:scale-95"
                   >
                      {tutorialStep < TUTORIAL_STEPS.length - 1 ? "Lanjut" : "Mulai"}
                   </button>
                </div>
             </div>
             
             {/* Skip button (only shown if not on the last step) */}
             {tutorialStep < TUTORIAL_STEPS.length - 1 && (
                <button 
                   onClick={() => { 
                      playSound.click(); 
                      setShowTutorial(false); 
                      syncStateToFirebase({ hasSeenTutorial: true });
                   }}
                   className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 pointer-events-auto bg-black/30 rounded-full p-1"
                   title="Lewati Tutorial"
                >
                   <span className="material-symbols-outlined block text-[18px]">close</span>
                </button>
             )}
          </div>
        </div>
      )}

      {/* FULL INVENTORY OVERLAY */}
      {showFullInventory && (
        <div className={`fixed inset-0 ${isSidebarOpen ? 'md:pl-64' : ''} transition-all duration-300 z-[60] bg-black/60 backdrop-blur-sm pointer-events-auto font-mono flex items-center justify-center p-4`}>
          <div 
             className="absolute inset-0 bg-[radial-gradient(#1c1e2f_1px,transparent_1px)] [background-size:4px_4px] opacity-30" 
             onClick={() => { playSound.click(); setShowFullInventory(false); }}
             onPointerDown={() => { playSound.click(); setShowFullInventory(false); }}
          ></div>
          <div className="bg-[#1e2235] border-4 border-[#ffb77d] shadow-[0_0_50px_rgba(255,183,125,0.3)] max-w-2xl w-full max-h-[85vh] relative z-10 flex flex-col pointer-events-auto">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2a2d45] to-[#1e2235] border-b border-[#ffb77d]/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ffb77d] text-2xl">inventory_2</span>
                <div>
                  <h2 className="text-[#ffb77d] font-bold uppercase tracking-widest text-lg leading-none">Penyimpanan Muatan</h2>
                  <p className="text-[#ddc1ae] text-xs mt-1">Barang terkumpul: {inventory.length}</p>
                </div>
              </div>
              <button 
                onClick={() => { playSound.click(); setShowFullInventory(false); }}
                className="text-[#ddc1ae] hover:text-[#ffb77d] transition-colors p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* List */}
            <div className="p-4 md:p-6 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
              {inventory.length === 0 ? (
                 <div className="text-center text-[#ddc1ae]/50 py-10 uppercase tracking-widest text-sm">
                     Belum ada muatan yang tersimpan
                 </div>
              ) : (
                [...inventory].sort().map((itemName) => {
                  const details = INVENTORY_DETAILS[itemName];
                  if (!details) return null;
                  
                  // Check if item is already in quick slots
                  const isQuickSlotted = [...inventory].reverse().slice(0, 4).includes(itemName);

                  return (
                    <div key={itemName} className="p-3 border bg-[#272939] border-[#564334] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-white/10 border border-white/20 rounded flex items-center justify-center text-3xl shadow-inner">
                          {details.icon}
                        </div>
                        <div>
                          <h3 className="text-white font-bold uppercase tracking-widest text-sm md:text-base text-shadow-sm">{details.name} ( {itemName} )</h3>
                          <p className="text-[#ddc1ae]/90 text-xs mt-1 max-w-md hidden sm:block leading-snug">{details.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => equipItemToQuickSlot(itemName)}
                        disabled={isQuickSlotted}
                        className={`w-full sm:w-auto px-4 py-2 border flex items-center justify-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                            isQuickSlotted 
                            ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 cursor-default cursor-not-allowed opacity-80' 
                            : 'bg-[#ffb77d]/10 hover:bg-[#ffb77d]/20 border-[#ffb77d]/50 text-[#ffb77d] hover:scale-105 active:scale-95'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                            {isQuickSlotted ? 'check_circle' : 'back_hand'}
                        </span>
                        {isQuickSlotted ? 'Di Siapkan' : 'Siapkan'}
                      </button>
                      <p className="text-[#ddc1ae]/90 text-xs mt-2 block sm:hidden leading-snug">{details.desc}</p>
                    </div>
                  );
                })
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* QUEST LOG OVERLAY */}
      {showQuestLog && (
        <div className={`fixed inset-0 ${isSidebarOpen ? 'md:pl-64' : ''} transition-all duration-300 z-[60] bg-black/60 backdrop-blur-sm pointer-events-auto font-mono flex items-center justify-center p-4`}>
          <div 
             className="absolute inset-0 bg-[radial-gradient(#1c1e2f_1px,transparent_1px)] [background-size:4px_4px] opacity-30" 
             onClick={() => { playSound.click(); setShowQuestLog(false); }}
             onPointerDown={() => { playSound.click(); setShowQuestLog(false); }}
          ></div>
          
          <section className="relative w-[90%] sm:w-[80%] md:w-[70%] max-w-2xl bg-[#1A1C2C] border-2 md:border-4 border-[#564334] rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,0.6)] flex flex-col max-h-[80vh] overflow-hidden pointer-events-auto">
            {/* Header */}
            <div className="bg-[#323445] border-b-2 md:border-b-4 border-[#564334] p-1.5 px-3 md:p-4 flex justify-between items-center relative">
              <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                <span className="material-symbols-outlined text-[#ffb77d] text-lg md:text-3xl">scrollable_header</span>
                <h2 className="text-[#ffb77d] text-[10px] md:text-lg uppercase tracking-widest font-black leading-tight">Jurnal Quest</h2>
              </div>
              <button 
                onClick={() => { playSound.click(); setShowQuestLog(false); }}
                onPointerDown={() => { playSound.click(); setShowQuestLog(false); }}
                className="w-6 h-6 md:w-10 md:h-10 shrink-0 bg-red-900/50 border md:border-2 border-red-950 flex items-center justify-center text-white hover:bg-red-600 transition-colors active:translate-y-1 shadow-[0_2px_0_0_rgba(0,0,0,1)] active:shadow-none"
              >
                <span className="material-symbols-outlined text-[10px] md:text-base">close</span>
              </button>
            </div>

            {/* List */}
            <div className="p-2 md:p-6 overflow-y-auto flex flex-col gap-1.5 md:gap-3 custom-scrollbar">
              {QUESTS.map(quest => (
                <div key={quest.id} className={`p-1.5 md:p-3 border ${quest.completed ? 'bg-[#181a2a] border-[#37946E] opacity-70' : 'bg-[#272939] border-[#ffb77d]'} flex flex-row items-center justify-between gap-2 md:gap-3 transition-all hover:translate-x-1`}>
                  <div className="flex flex-row items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-5 h-5 md:w-8 md:h-8 flex items-center justify-center border md:border-2 ${quest.completed ? 'bg-[#37946E] border-[#e1e1f7] text-[#e1e1f7]' : 'bg-[#181a2a] border-[#ffb77d] text-[#ffb77d]'}`}>
                      <span className="material-symbols-outlined text-[10px] md:text-sm leading-none">{quest.completed ? "desktop_windows" : "hourglass_empty"}</span>
                    </div>
                    <div className="flex-grow min-w-0 flex flex-col justify-center">
                      <h3 className={`text-[9px] md:text-base uppercase tracking-wider font-bold leading-tight truncate ${quest.completed ? 'text-[#e1e1f7] line-through decoration-2 decoration-[#37946E]' : 'text-[#ffb77d]'}`}>{quest.title}</h3>
                      <p className="text-[#ddc1ae] text-[7px] md:text-xs leading-tight mt-0.5 truncate">{quest.desc}</p>
                    </div>
                  </div>
                  {quest.completed && (
                    <div className="flex-shrink-0 ml-1">
                      <span className="text-[#37946E] font-bold text-[7px] md:text-xs uppercase tracking-widest bg-[#101222] px-1 md:px-2 py-0.5 md:py-1 border border-[#37946E] leading-none block">Selesai</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="bg-[#323445] border-t-4 border-[#564334] p-3 text-center text-[#ddc1ae] text-xs uppercase tracking-widest">
              Lengkapi semua material untuk membangun Masjid Agung.
            </div>
          </section>
        </div>
      )}

      {/* PUSTAKA SEJARAH (LORE) OVERLAY */}
      {showLore && (
        <div className={`fixed inset-0 ${isSidebarOpen ? 'md:pl-64' : ''} transition-all duration-300 z-[60] bg-black/60 backdrop-blur-sm pointer-events-auto font-mono flex items-center justify-center p-4`}>
          <div 
             className="absolute inset-0 bg-[radial-gradient(#1c1e2f_1px,transparent_1px)] [background-size:4px_4px] opacity-30" 
             onClick={() => { playSound.click(); setShowLore(false); }}
             onPointerDown={() => { playSound.click(); setShowLore(false); }}
          ></div>
          
          <section className="relative w-full max-w-2xl bg-[#1A1C2C] border-2 border-[#564334] rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,0.6)] flex flex-col pointer-events-auto animate-[slideDown_0.3s_ease-out_forwards] max-h-[85vh]">
            {/* Header */}
            <div className="bg-[#323445] border-b-2 border-[#564334] p-4 flex justify-between items-center relative">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ffb77d] text-2xl">menu_book</span>
                <h2 className="text-[#ffb77d] text-base md:text-xl uppercase tracking-widest font-black">Pustaka Sejarah</h2>
              </div>
              <button 
                  onClick={() => { playSound.click(); setShowLore(false); }}
                  className="w-10 h-10 flex items-center justify-center bg-[#1A1C2C] hover:bg-red-900 border-2 border-[#564334] hover:border-red-500 text-[#ddc1ae] hover:text-white transition-colors group cursor-pointer"
              >
                 <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">close</span>
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 md:p-6 bg-[#181a2a] overflow-y-auto flex flex-col gap-4">
               {Object.entries(LORE_ENTRIES).map(([id, lore]) => {
                  const isUnlocked = completedNpcs.includes(lore.unlockNpcId);
                  
                  // Hide 'kijaga' completely if it's not unlocked yet
                  if (id === 'kijaga' && !isUnlocked) {
                      return null;
                  }

                  return (
                    <div key={id} className={`p-4 border-l-4 transition-all ${isUnlocked ? 'bg-[#323445] border-[#ff8c00]' : 'bg-[#1e2235] border-slate-700 opacity-60'}`}>
                       <div className="flex items-center gap-3 mb-2">
                           {isUnlocked ? (
                               <span className="material-symbols-outlined text-emerald-400">lock_open</span>
                           ) : (
                               <span className="material-symbols-outlined text-slate-500">lock</span>
                           )}
                           <h3 className={`font-bold ${isUnlocked ? 'text-[#e1e1f7]' : 'text-slate-400'} uppercase tracking-wide`}>{isUnlocked ? lore.title : "Catatan Terkunci"}</h3>
                       </div>
                       <p className={`text-sm leading-relaxed ${isUnlocked ? 'text-[#ddc1ae] italic font-serif text-base' : 'text-slate-500 font-mono text-xs'}`}>
                          {isUnlocked ? lore.unlockContent : lore.lockedContent}
                       </p>
                       {isUnlocked && (
                           <div className="mt-3 text-xs text-sky-300 font-mono border-t border-white/10 pt-2 opacity-80">
                               Sumber: {lore.source}
                           </div>
                       )}
                    </div>
                  );
               })}
            </div>
          </section>
        </div>
      )}

      {/* PAUSE MENU OVERLAY */}
      {isPaused && (
        <div className={`fixed inset-0 ${isSidebarOpen ? 'md:pl-64' : ''} transition-all duration-300 z-[60] bg-black/60 backdrop-blur-sm pointer-events-auto font-mono flex items-center justify-center p-4`}>
          <div 
             className="absolute inset-0 bg-[radial-gradient(#1c1e2f_1px,transparent_1px)] [background-size:4px_4px] opacity-30"
             onClick={() => { playSound.click(); setIsPaused(false); }}
             onPointerDown={() => { playSound.click(); setIsPaused(false); }}
          ></div>
          
          {/* Decorative Elements for UI Layering */}
          <div className="absolute left-8 bottom-8 z-[61] p-4 bg-[#1A1C2C]/80 border-2 border-[#564334] text-[#e1e1f7] max-w-sm hidden md:block pointer-events-none">
            <p className="mb-2 text-[#ffb77d] italic text-sm">"Beristirahatlah sejenak, wahai pengelana. Dunia Bintoro menanti langkahmu selanjutnya."</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#ff8c00] border border-[#623200]">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpgl_zbL6dEkiHlM3ize6gLPFRtlhhnuRMYeBg7u2nDtg4SnJinIKQfwpxbF68nNSWNjiUvRkR9LSwhqnoOt7WNaPPz2SHC54qTqOKnyhvpJkP3rfmlTna1cgvC2rxzhhHm-WX_CcvZv2AlQdev-Q9IzNS7JJFmd7miHOXRgvj8WOZWYXZvPm7zlOlglJwWevjcdOfpX_gsfsOnbJfCcoldeIOh_RfjZjW2t8XK11s7NKum1jq5NET5xep8OM1HQNMcRGerGjojdA" alt="Ki Ageng" />
              </div>
              <span className="text-[10px] uppercase font-bold text-[#e9c400] tracking-widest">Ki Ageng</span>
            </div>
          </div>

          <section className="relative w-[90%] md:w-[320px] md:absolute md:right-16 md:top-1/2 md:-translate-y-1/2 p-4 md:p-8 bg-[#1A1C2C] border-4 border-[#564334] rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] flex flex-col gap-4 md:gap-6 max-h-[90vh] overflow-y-auto">
            {/* Menu Header */}
            <div className="text-center relative mt-4 md:mt-0">
              <div className="absolute -top-10 md:-top-14 left-1/2 -translate-x-1/2 bg-[#ff8c00] text-[#623200] px-4 py-1 border-2 border-[#623200] shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
                <h2 className="font-mono text-sm uppercase tracking-widest animate-pulse font-bold">Menu</h2>
              </div>
              <div className="h-1 w-full bg-[#564334] mt-2"></div>
            </div>

            {/* Menu Buttons */}
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => { playSound.click(); setIsPaused(false); }}
                className="group relative bg-[#323445] border-2 border-[#ddc1ae] p-4 flex items-center justify-between transition-all hover:bg-[#ff8c00] hover:border-[#623200] shadow-[0_4px_0_0_#000] active:translate-y-1 active:shadow-none"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ffb77d] group-hover:text-[#623200]">arrow_back</span>
                  <span className="font-bold text-[#e1e1f7] group-hover:text-[#623200] uppercase tracking-wider text-[10px]">Kembali</span>
                </div>
              </button>

              <button 
                onClick={() => { playSound.click(); setIsPaused(false); setShowQuestLog(true); }}
                className="group relative bg-[#323445] border-2 border-[#ddc1ae] p-4 flex items-center justify-between transition-all hover:bg-[#ff8c00] hover:border-[#623200] shadow-[0_4px_0_0_#000] active:translate-y-1 active:shadow-none md:hidden"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ffb77d] group-hover:text-[#623200]">scrollable_header</span>
                  <span className="font-bold text-[#e1e1f7] group-hover:text-[#623200] uppercase tracking-wider text-[10px]">Jurnal Quest</span>
                </div>
              </button>

              <button 
                onClick={() => { playSound.click(); setIsPaused(false); setShowMap(true); }}
                className="group relative bg-[#323445] border-2 border-[#ddc1ae] p-4 flex items-center justify-between transition-all hover:bg-[#ff8c00] hover:border-[#623200] shadow-[0_4px_0_0_#000] active:translate-y-1 active:shadow-none md:hidden"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ffb77d] group-hover:text-[#623200]">map</span>
                  <span className="font-bold text-[#e1e1f7] group-hover:text-[#623200] uppercase tracking-wider text-[10px]">Peta Bintoro</span>
                </div>
              </button>

              <button 
                onClick={() => { playSound.click(); setIsPaused(false); setShowLeaderboard(true); }}
                className="group relative bg-[#323445] border-2 border-[#ddc1ae] p-4 flex items-center justify-between transition-all hover:bg-[#ff8c00] hover:border-[#623200] shadow-[0_4px_0_0_#000] active:translate-y-1 active:shadow-none md:hidden"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ffb77d] group-hover:text-[#623200]">trophy</span>
                  <span className="font-bold text-[#e1e1f7] group-hover:text-[#623200] uppercase tracking-wider text-[10px]">Klasemen</span>
                </div>
              </button>

              <button 
                onClick={() => { playSound.click(); setIsPaused(false); setShowLore(true); }}
                className="group relative bg-[#323445] border-2 border-[#ddc1ae] p-4 flex items-center justify-between transition-all hover:bg-[#ff8c00] hover:border-[#623200] shadow-[0_4px_0_0_#000] active:translate-y-1 active:shadow-none md:hidden"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ffb77d] group-hover:text-[#623200]">menu_book</span>
                  <span className="font-bold text-[#e1e1f7] group-hover:text-[#623200] uppercase tracking-wider text-[10px]">Pustaka Sejarah</span>
                </div>
              </button>

              <div>
                <button 
                  onClick={() => { playSound.click(); setShowSettings(!showSettings); }}
                  className="w-full group relative bg-[#323445] border-2 border-[#ddc1ae] p-4 flex items-center justify-between transition-all hover:bg-[#ff8c00] hover:border-[#623200] shadow-[0_4px_0_0_#000] active:translate-y-1 active:shadow-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#ffb77d] group-hover:text-[#623200]">settings</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#e1e1f7] group-hover:text-[#623200] uppercase tracking-wider text-[10px]">Pengaturan</span>
                    </div>
                  </div>
                </button>
                {showSettings && (
                  <div className="bg-[#181a2a] border-2 border-t-0 border-[#ddc1ae] p-4 flex flex-col gap-2">
                    <button 
                      onClick={toggleFullscreen}
                      className="w-full bg-[#323445] hover:bg-[#43465e] border border-[#564334] p-3 text-left font-bold text-[#e1e1f7] text-[10px] uppercase flex items-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isFullscreen ? "fullscreen_exit" : "fullscreen"}
                      </span>
                      {isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                    </button>
                    <button 
                      onClick={() => setLowGraphics(!lowGraphics)}
                      className="w-full bg-[#323445] hover:bg-[#43465e] border border-[#564334] p-3 text-left font-bold text-[#e1e1f7] text-[10px] uppercase flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">
                          {lowGraphics ? "speed" : "high_quality"}
                        </span>
                        Grafis Rendah
                      </div>
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${lowGraphics ? 'bg-emerald-500' : 'bg-[#181a2a]'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${lowGraphics ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </button>
                    <span className="text-[#ddc1ae] text-[10px] font-bold uppercase tracking-widest">Volume Audio</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#ffb77d] text-sm">volume_down</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={volume}
                        onChange={(e) => setVolume(parseInt(e.target.value))}
                        className="w-full accent-[#ff8c00] h-2 bg-[#323445] rounded-full appearance-none cursor-pointer"
                      />
                      <span className="material-symbols-outlined text-[#ffb77d] text-sm">volume_up</span>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => { 
                  playSound.click(); 
                  setIsPaused(false); 
                  setInventory([]);
                  setCompletedNpcs([]);
                  changeAppState("game"); 
                  syncStateToFirebase({ appState: "game", inventory: [], completedNpcs: [] });
                }}
                className="group relative bg-red-900/50 border-2 border-red-950 p-4 flex items-center justify-between transition-all hover:bg-red-600 hover:border-red-800 shadow-[0_4px_0_0_#000] active:translate-y-1 active:shadow-none"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ffb77d] group-hover:text-white">refresh</span>
                  <span className="font-bold text-[#e1e1f7] group-hover:text-white uppercase tracking-wider text-[10px]">Ke Ki Jaga</span>
                </div>
              </button>
            </div>
            
            {/* Footer Stats in Menu */}
            <div className="mt-2 pt-4 border-t-4 border-[#564334] flex flex-col gap-2 font-mono text-sm">
                <div className="flex justify-between">
                    <span className="text-[#ddc1ae]">Waktu Main:</span>
                    <span className="font-bold text-[#ffb77d]">{new Date(playTimeSeconds * 1000).toISOString().substr(11, 8)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#ddc1ae]">Emas:</span>
                    <span className="text-[#e9c400] font-bold">1,478G</span>
                </div>
            </div>
          </section>
        </div>
      )}

      {/* ACHIEVEMENT OVERLAY */}
      {showAchievement && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto font-sans" onClick={() => { playSound.click(); setShowAchievement(false); }}>
          <div className="w-[90%] max-w-[600px] p-6 bg-[#1A1C2C]/95 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-row items-center gap-6 border border-[#ddc1ae]/20 text-left relative overflow-hidden animate-[scaleIn_0.3s_ease-out_forwards]" onClick={e => e.stopPropagation()}>
            {/* Glowing Medal Icon */}
            <div className="relative shrink-0 hidden sm:block">
              <div className="absolute inset-0 bg-[#37946E]/30 blur-2xl rounded-full"></div>
              <img alt="Glowing Green Medal" className="relative w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_15px_rgba(55,148,110,0.8)] rounded-full" src="/assets/medal-lowcortisol.jpg"/>
            </div>
            {/* Right Side */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                    <img alt="Glowing Green Medal" className="w-8 h-8 rounded-full sm:hidden" src="/assets/medal-lowcortisol.jpg"/>
                    <span className="inline-block px-3 py-1 bg-[#37946E]/10 text-[#37946E] text-[10px] font-bold tracking-[0.2em] rounded-full uppercase">
                      Achievement Unlocked
                    </span>
                </div>
                <h1 className="text-white font-extrabold text-xl md:text-2xl leading-tight tracking-tight mb-2">
                  LOW CORTISOL LIFESTYLE
                </h1>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                  Kamu memilih jalan damai. Hormon stresmu menurun drastis di pinggir sungai Bintoro.
                </p>
              </div>
              {/* sleek Button */}
              <div className="mt-4">
                <button onClick={() => { playSound.click(); setShowAchievement(false); }} className="w-full sm:w-auto bg-[#37946E] hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_8px_20px_-6px_rgba(55,148,110,0.6)] flex items-center justify-center gap-2">
                  Lanjut Santai
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-1 -right-1 w-12 h-12 bg-orange-500/20 blur-xl rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-12 h-12 bg-blue-500/20 blur-xl rounded-full"></div>
          </div>
        </div>
      )}

      {/* WASTED OVERLAY */}
      {isWasted && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md px-4 pointer-events-auto">
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(220,38,38,0.3)] z-0"></div>

          <h1 className="text-6xl sm:text-8xl font-black text-red-500 tracking-[0.2em] drop-shadow-[0_4px_20px_rgba(239,68,68,0.8)] mb-8 animate-pulse z-10 uppercase text-center">WASTED</h1>
          <p className="text-slate-200 text-xl text-center max-w-2xl bg-white/5 backdrop-blur-2xl rounded-3xl border border-red-500/50 p-8 shadow-2xl mb-10 z-10 italic font-serif">
             "{NPC_QUIZ[activeNpcId].questions[currentQuestionIndex].wrongReply}" <br/><br/>
             <span className="text-red-400 not-italic font-mono text-sm tracking-widest uppercase">Pengetahuan sejarahmu kurang tajam, pengembara.</span>
          </p>
          <button onClick={() => { playSound.click(); setIsWasted(false); setCurrentQuestionIndex(0); setShowChat(false); }} 
                  className="bg-white/10 hover:bg-red-500/20 border border-white/20 text-white px-10 py-4 rounded-xl uppercase tracking-widest active:scale-95 font-bold z-10 transition-all font-mono drop-shadow-lg">
             Coba Lagi
          </button>
        </div>
      )}

      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}

      {/* VIGNETTE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.7)] z-10"></div>
    </main>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

