import { 
  Clock, 
  Timer, 
  AlertTriangle, 
  CheckCircle,
  Thermometer,
  ClipboardCheck,
  Users,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";

const prepPlans = [
  {
    id: 1,
    name: "Breakfast Prep",
    status: "completed",
    startTime: "5:00 AM",
    endTime: "8:00 AM",
    tasks: 12,
    completedTasks: 12,
    assignedTo: "Sarah Martinez"
  },
  {
    id: 2,
    name: "Lunch Prep",
    status: "in-progress",
    startTime: "9:00 AM",
    endTime: "11:30 AM",
    tasks: 18,
    completedTasks: 14,
    assignedTo: "Mike Chen"
  },
  {
    id: 3,
    name: "Dinner Prep",
    status: "scheduled",
    startTime: "2:00 PM",
    endTime: "5:00 PM",
    tasks: 24,
    completedTasks: 0,
    assignedTo: "Jennifer Kim"
  }
];

const activeTimers = [
  { id: 1, item: "Bread Dough Rising", timeLeft: "45:32", type: "prep" },
  { id: 2, item: "Soup Simmering", timeLeft: "1:23:15", type: "cooking" },
  { id: 3, item: "Marinated Chicken", timeLeft: "2:15:00", type: "marinating" }
];

export default function Kitchen() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kitchen Management</h1>
          <p className="text-muted-foreground mt-2">
            Daily prep plans, timers, and HACCP compliance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Timer className="w-4 h-4 mr-2" />
            Add Timer
          </Button>
          <Button variant="hero">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Start Checklist
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Timers"
          value={3}
          change="2 expiring soon"
          changeType="negative"
          icon={Timer}
        />
        <StatsCard
          title="Prep Tasks"
          value="14/18"
          change="78% complete"
          changeType="positive"
          icon={CheckCircle}
        />
        <StatsCard
          title="Temperature Checks"
          value={12}
          change="All within range"
          changeType="positive"
          icon={Thermometer}
        />
        <StatsCard
          title="Staff on Duty"
          value={6}
          change="Full coverage"
          changeType="positive"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Prep Plans */}
        <div className="space-y-6">
          <h3 className="font-semibold text-lg">Daily Prep Plans</h3>
          
          <div className="space-y-4">
            {prepPlans.map((plan) => (
              <div key={plan.id} className="bg-card rounded-lg border shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-lg">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {plan.startTime} - {plan.endTime} • {plan.assignedTo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      plan.status === 'completed' ? 'bg-success/10 text-success' :
                      plan.status === 'in-progress' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {plan.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {plan.completedTasks}/{plan.tasks} tasks
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(plan.completedTasks / plan.tasks) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    {plan.status === 'scheduled' && (
                      <Button variant="default" size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Start Prep
                      </Button>
                    )}
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Timers & Alerts */}
        <div className="space-y-6">
          {/* Active Timers */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Active Timers</h3>
            <div className="space-y-3">
              {activeTimers.map((timer) => (
                <div key={timer.id} className="bg-card rounded-lg border shadow-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{timer.item}</h4>
                      <p className="text-sm text-muted-foreground capitalize">{timer.type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono font-bold text-primary">
                        {timer.timeLeft}
                      </div>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Timer className="w-4 h-4 mr-2" />
                        Extend
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HACCP Compliance */}
          <div className="bg-card rounded-lg border shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Thermometer className="w-4 h-4 text-secondary" />
              </div>
              <h3 className="font-semibold">HACCP Monitoring</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Temperature Logs</span>
                  <span className="text-sm text-success">Up to date</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Last check: 30 minutes ago
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Cleaning Schedule</span>
                  <span className="text-sm text-warning">Due in 2 hours</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Deep clean prep station #3
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Allergen Controls</span>
                  <span className="text-sm text-success">Verified</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cross-contamination prevention active
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-lg border shadow-card p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" className="h-16 flex-col">
                <Thermometer className="w-5 h-5 mb-1" />
                <span className="text-xs">Log Temp</span>
              </Button>
              <Button variant="outline" size="sm" className="h-16 flex-col">
                <AlertTriangle className="w-5 h-5 mb-1" />
                <span className="text-xs">Report Issue</span>
              </Button>
              <Button variant="outline" size="sm" className="h-16 flex-col">
                <CheckCircle className="w-5 h-5 mb-1" />
                <span className="text-xs">Complete Task</span>
              </Button>
              <Button variant="outline" size="sm" className="h-16 flex-col">
                <Clock className="w-5 h-5 mb-1" />
                <span className="text-xs">Hold Time</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}