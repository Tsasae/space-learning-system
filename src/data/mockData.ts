import {
  BarChart3,
  BookOpen,
  BookPlus,
  ClipboardList,
  Cloud,
  Database,
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
  LibraryBig,
  Settings,
  Users,
  Workflow,
} from "lucide-react";
import {
  DatasetItem,
  HPCJob,
  MetricCardData,
  ModuleUnit,
  NavItem,
  ProjectCard,
  TimelinePoint,
} from "../types";

export const instructorNavItems: NavItem[] = [
  { key: "createCourse", label: "Хичээл үүсгэх", icon: BookPlus },
  { key: "myCourses", label: "Миний хичээлүүд", icon: LibraryBig },
  { key: "instructorStudents", label: "Сурагчид", icon: Users },
  { key: "instructorAssignments", label: "Даалгавар", icon: ClipboardList },
  { key: "settings", label: "Тохиргоо", icon: Settings },
];

export const navigationItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "courses", label: "Course Environment", icon: BookOpen },
  { key: "lab", label: "Virtual Lab", icon: FlaskConical },
  { key: "spatial", label: "Spatial Data", icon: Database },
  { key: "cloudAnalytics", label: "Cloud Analytics", icon: Cloud },
  { key: "analytics", label: "Analytics & Reports", icon: BarChart3 },
  { key: "jobs", label: "HPC Jobs", icon: Workflow },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "settings", label: "Settings", icon: Settings },
];

export const adminMetrics: MetricCardData[] = [
  { title: "CPU Usage", value: "74%", delta: "+4.8%", tone: "accent" },
  { title: "Active Sessions", value: "182", delta: "+23 live", tone: "success" },
  { title: "Users / Today", value: "1,248 / 213", delta: "+12.3%", tone: "accent" },
  { title: "Storage", value: "18.4 TB", delta: "62% utilized", tone: "warning" },
];

export const instructorMetrics: MetricCardData[] = [
  { title: "Engagement", value: "89%", delta: "+6.2%", tone: "success" },
  { title: "Assignments", value: "81%", delta: "completion", tone: "accent" },
  { title: "Active Labs", value: "27", delta: "currently running", tone: "warning" },
  { title: "At-Risk Learners", value: "14", delta: "-3 this week", tone: "accent" },
];

export const studentMetrics: MetricCardData[] = [
  { title: "Progress", value: "68%", delta: "semester path", tone: "success" },
  { title: "Modules", value: "5", delta: "enrolled", tone: "accent" },
  { title: "Lab Credits", value: "24 GPUh", delta: "remaining", tone: "warning" },
  { title: "Achievements", value: "12", delta: "badges earned", tone: "accent" },
];

export const systemTimeline: TimelinePoint[] = [
  { name: "09:00", cpu: 54, response: 190, sessions: 88 },
  { name: "10:00", cpu: 62, response: 210, sessions: 96 },
  { name: "11:00", cpu: 71, response: 250, sessions: 112 },
  { name: "12:00", cpu: 67, response: 226, sessions: 108 },
  { name: "13:00", cpu: 78, response: 286, sessions: 141 },
  { name: "14:00", cpu: 74, response: 242, sessions: 132 },
  { name: "15:00", cpu: 81, response: 310, sessions: 182 },
];

export const engagementBreakdown = [
  { name: "Lunar AI", value: 92 },
  { name: "Remote Sensing", value: 87 },
  { name: "HPC", value: 74 },
  { name: "Transformers", value: 78 },
  { name: "Capstone", value: 65 },
];

export const moduleUnits: ModuleUnit[] = [
  {
    title: "Case 1 - AI for Lunar Formation & Structure",
    topics: [
      "Lunar origin theories",
      "Surface evolution",
      "Geology, topography, and moonquakes",
      "Internal structure modelling",
    ],
    ai: ["Crater detection with CNN", "Lunar resource mapping"],
    practice: ["Neural network primer", "Multispectral classification lab"],
    progress: 76,
  },
  {
    title: "Case 2 - Remote Sensing",
    topics: [
      "Satellite dataset workflows",
      "Crater detection benchmarking",
      "Remote sensing validation",
    ],
    ai: ["Ice detection clustering", "Rock mapping segmentation"],
    practice: ["Dataset QA notebook", "Terrain embedding exercise"],
    progress: 58,
  },
  {
    title: "Case 3 - HPC Fundamentals",
    topics: ["GPU architecture", "Clusters and SLURM", "MPI and OpenMP"],
    ai: ["Distributed training on lunar datasets"],
    practice: ["Batch job tuning", "Parallel matrix workflow"],
    progress: 47,
  },
  {
    title: "Case 4 - AI/ML",
    topics: [
      "CNN, Autoencoder, Transformers",
      "Crater recognition",
      "Mineral classification",
    ],
    ai: ["Representation learning for topography"],
    practice: ["Feature attribution lab", "Hybrid model comparison"],
    progress: 39,
  },
  {
    title: "Case 5 - Capstone",
    topics: [
      "Crater catalog design",
      "Moonquake analysis",
      "AI site selection pipelines",
    ],
    ai: ["Team-based model review"],
    practice: ["Proposal sprint", "Validation checklist"],
    progress: 21,
  },
];

export const datasets: DatasetItem[] = [
  {
    id: "LROC-2041",
    name: "LROC Polar Mosaic",
    satellite: "LRO",
    date: "2026-04-02",
    coords: "-89.1, 23.4",
    type: "Elevation",
  },
  {
    id: "CH-8890",
    name: "Permanently Shadowed Regions",
    satellite: "Chandrayaan-2",
    date: "2026-03-27",
    coords: "-84.4, 41.2",
    type: "Multispectral",
  },
  {
    id: "KAG-5128",
    name: "Mare Basalt Reflectance",
    satellite: "Kaguya",
    date: "2026-03-18",
    coords: "14.7, 35.9",
    type: "NDVI proxy",
  },
];

export const resourceUsage = [
  { name: "Mon", gpu: 42, cpu: 61, storage: 48 },
  { name: "Tue", gpu: 49, cpu: 58, storage: 51 },
  { name: "Wed", gpu: 64, cpu: 72, storage: 52 },
  { name: "Thu", gpu: 59, cpu: 68, storage: 56 },
  { name: "Fri", gpu: 71, cpu: 74, storage: 58 },
];

export const satisfactionHeatmap = [
  ["Navigation", 4.3],
  ["Lab UX", 4.6],
  ["AI Modules", 4.7],
  ["Spatial Tools", 4.1],
  ["HPC Queue", 3.9],
  ["Support", 4.5],
];

export const hpcJobs: HPCJob[] = [
  {
    id: "job-2194",
    model: "CNN crater detection",
    resources: "2x A100, 48 CPU",
    status: "Running",
    progress: 64,
    logs: [
      "[14:10] Allocated node luna-gpu-07",
      "[14:13] Epoch 12/30 accuracy 0.93",
      "[14:18] Validation sweep in progress",
    ],
  },
  {
    id: "job-2191",
    model: "MPI terrain clustering",
    resources: "128 CPU",
    status: "Completed",
    progress: 100,
    logs: [
      "[13:02] Queue admitted",
      "[13:22] Parallel tiles merged",
      "[13:28] Results archived to S3",
    ],
  },
  {
    id: "job-2201",
    model: "Transformer mineral classifier",
    resources: "1x H100, 32 CPU",
    status: "Queued",
    progress: 12,
    logs: ["[14:19] Pending GPU reservation", "[14:19] Est. start 8 min"],
  },
];

export const projects: ProjectCard[] = [
  {
    title: "Crater Catalog Intelligence",
    team: "Team Tycho",
    focus: "Automated crater indexing with validation on polar mosaics",
    milestone: "Annotation QA review",
  },
  {
    title: "Moonquake Signal Discovery",
    team: "Team Apollo",
    focus: "Event clustering from seismic series and anomaly screening",
    milestone: "Feature engineering complete",
  },
  {
    title: "AI Landing Site Selection",
    team: "Team Shackleton",
    focus: "Safety, illumination, and resource-aware ranking engine",
    milestone: "Decision dashboard prototype",
  },
];
