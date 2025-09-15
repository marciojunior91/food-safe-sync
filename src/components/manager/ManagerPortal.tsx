import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  FileText,
  Eye,
  Check,
  X
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  assignee: string;
  dueDate: string;
  category: string;
}

interface ApprovalRequest {
  id: string;
  type: 'discard' | 'purchase' | 'adjustment';
  item: string;
  quantity: number;
  reason: string;
  requestedBy: string;
  timestamp: string;
  value: number;
  status: 'pending' | 'approved' | 'rejected';
}

const ManagerPortal = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "TSK001",
      title: "Daily Temperature Logs",
      description: "Review and verify all temperature readings for walk-in coolers",
      priority: "high",
      status: "pending",
      assignee: "Sarah Chen",
      dueDate: "2024-12-17",
      category: "Food Safety"
    },
    {
      id: "TSK002", 
      title: "Inventory Cycle Count",
      description: "Complete physical count for dry goods section",
      priority: "medium",
      status: "in-progress",
      assignee: "Mike Rodriguez",
      dueDate: "2024-12-18",
      category: "Inventory"
    },
    {
      id: "TSK003",
      title: "Supplier Quality Review",
      description: "Evaluate last week's produce deliveries for quality standards",
      priority: "low",
      status: "completed",
      assignee: "Lisa Park",
      dueDate: "2024-12-16",
      category: "Quality Control"
    }
  ]);

  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([
    {
      id: "APR001",
      type: "discard",
      item: "Ground Beef (80/20)",
      quantity: 5,
      reason: "Expired - passed use-by date",
      requestedBy: "Kitchen Staff",
      timestamp: "2024-12-17 14:30",
      value: 24.95,
      status: "pending"
    },
    {
      id: "APR002",
      type: "purchase",
      item: "Organic Chicken Breast",
      quantity: 20,
      reason: "Low stock - needed for weekend prep",
      requestedBy: "Head Chef",
      timestamp: "2024-12-17 13:15",
      value: 139.80,
      status: "pending"
    },
    {
      id: "APR003",
      type: "adjustment",
      item: "Roma Tomatoes",
      quantity: -3,
      reason: "Damaged during delivery",
      requestedBy: "Receiving",
      timestamp: "2024-12-17 11:45",
      value: 8.97,
      status: "approved"
    }
  ]);

  const handleApproval = (id: string, action: 'approved' | 'rejected') => {
    setApprovalRequests(prev => 
      prev.map(req => 
        req.id === id ? { ...req, status: action } : req
      )
    );
  };

  const handleTaskStatusChange = (id: string, newStatus: Task['status']) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'status-critical';
      case 'medium': return 'status-warning'; 
      case 'low': return 'status-safe';
      default: return 'status-unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'status-safe';
      case 'in-progress': return 'status-warning';
      case 'pending': return 'status-unknown';
      case 'approved': return 'status-safe';
      case 'rejected': return 'status-critical';
      default: return 'status-unknown';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discard': return XCircle;
      case 'purchase': return DollarSign;
      case 'adjustment': return TrendingUp;
      default: return FileText;
    }
  };

  const pendingApprovals = approvalRequests.filter(req => req.status === 'pending').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalApprovalValue = approvalRequests
    .filter(req => req.status === 'pending')
    .reduce((sum, req) => sum + req.value, 0);

  return (
    <div className="space-y-6">
      {/* Manager Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="kitchen-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold text-status-warning">{pendingApprovals}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-status-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="kitchen-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Tasks</p>
                <p className="text-2xl font-bold">{pendingTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="kitchen-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold text-status-safe">{completedTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-status-safe" />
            </div>
          </CardContent>
        </Card>

        <Card className="kitchen-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approval Value</p>
                <p className="text-2xl font-bold">${totalApprovalValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="approvals">Approval Requests</TabsTrigger>
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <Card className="kitchen-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ClipboardList className="w-5 h-5" />
                <span>Pending Approvals</span>
              </CardTitle>
              <CardDescription>Review and approve discard, purchase, and adjustment requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvalRequests.map((request) => {
                const TypeIcon = getTypeIcon(request.type);
                
                return (
                  <div key={request.id} className="p-4 rounded-lg bg-kitchen-surface border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          request.type === 'discard' ? 'bg-status-critical/20' :
                          request.type === 'purchase' ? 'bg-status-warning/20' :
                          'bg-status-safe/20'
                        }`}>
                          <TypeIcon className={`w-5 h-5 ${
                            request.type === 'discard' ? 'text-status-critical' :
                            request.type === 'purchase' ? 'text-status-warning' :
                            'text-status-safe'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-foreground">{request.item}</h4>
                            <Badge variant="outline" className="capitalize">
                              {request.type}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Requested by: {request.requestedBy}</span>
                            <span>•</span>
                            <span>{request.timestamp}</span>
                            <span>•</span>
                            <span className="font-medium">
                              {request.type === 'adjustment' && request.quantity < 0 ? '' : ''}
                              {Math.abs(request.quantity)} units
                            </span>
                            <span>•</span>
                            <span className="font-medium">${request.value.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        
                        {request.status === 'pending' && (
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleApproval(request.id, 'approved')}
                              className="gradient-status-safe text-white border-none"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleApproval(request.id, 'rejected')}
                              className="gradient-status-critical text-white border-none"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        
                        <Button variant="outline" size="sm" className="touch-target">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="kitchen-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Team Tasks</span>
              </CardTitle>
              <CardDescription>Monitor daily tasks and team assignments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 rounded-lg bg-kitchen-surface border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-foreground">{task.title}</h4>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {task.category}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Assigned to: <span className="font-medium">{task.assignee}</span></span>
                        <span>•</span>
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getStatusColor(task.status)}>
                        {task.status.replace('-', ' ')}
                      </Badge>
                      
                      {task.status !== 'completed' && (
                        <div className="flex space-x-1">
                          {task.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleTaskStatusChange(task.id, 'in-progress')}
                            >
                              Start
                            </Button>
                          )}
                          {task.status === 'in-progress' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleTaskStatusChange(task.id, 'completed')}
                              className="gradient-status-safe text-white border-none"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerPortal;