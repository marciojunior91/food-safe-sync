import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Award, Building2, Shield } from "lucide-react";
interface Person {
  user_id: string;
  display_name: string;
  position: string;
  phone: string;
  hire_date: string;
  department_id: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface Department {
  id: string;
  name: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  expiry_date: string;
}

export default function People() {
  const [people, setPeople] = useState<Person[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, string[]>>(new Map());
  const [departments, setDepartments] = useState<Map<string, string>>(new Map());
  const [certifications, setCertifications] = useState<Map<string, Certification[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const { isAdmin, isManager } = useUserRole();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch profiles, departments, certifications, and user roles
      const [peopleRes, deptRes, certRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, position, phone, hire_date, department_id").order("display_name"),
        supabase.from("departments").select("*"),
        supabase.from("certifications").select("*"),
        // Only admins and managers can view other users' roles
        (isAdmin || isManager) 
          ? supabase.from("user_roles").select("user_id, role")
          : Promise.resolve({ data: [], error: null })
      ]);

      if (peopleRes.error) throw peopleRes.error;
      if (deptRes.error) throw deptRes.error;
      if (certRes.error) throw certRes.error;

      setPeople(peopleRes.data || []);

      const deptMap = new Map();
      (deptRes.data || []).forEach((dept: Department) => {
        deptMap.set(dept.id, dept.name);
      });
      setDepartments(deptMap);

      const certMap = new Map();
      (certRes.data || []).forEach((cert: Certification & { user_id: string }) => {
        if (!certMap.has(cert.user_id)) {
          certMap.set(cert.user_id, []);
        }
        certMap.get(cert.user_id).push(cert);
      });
      setCertifications(certMap);

      // Map user roles
      const rolesMap = new Map();
      if (rolesRes.data) {
        (rolesRes.data as UserRole[]).forEach((ur) => {
          if (!rolesMap.has(ur.user_id)) {
            rolesMap.set(ur.user_id, []);
          }
          rolesMap.get(ur.user_id).push(ur.role);
        });
      }
      setUserRoles(rolesMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load people data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            People
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {people.map((person) => {
            const personCerts = certifications.get(person.user_id) || [];
            const personRoles = userRoles.get(person.user_id) || [];
            const initials = person.display_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() || "?";

            return (
              <Card key={person.user_id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle>{person.display_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{person.position}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {person.phone && (isAdmin || isManager) && (
                      <p className="text-sm">
                        <span className="font-medium">Phone:</span> {person.phone}
                      </p>
                    )}
                    
                    {person.department_id && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {departments.get(person.department_id)}
                        </span>
                      </div>
                    )}

                    {personRoles.length > 0 && (isAdmin || isManager) && (
                      <div>
                        <p className="text-sm font-medium mb-1 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Roles
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {personRoles.map((role, idx) => (
                            <Badge key={idx} variant="secondary">{role}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {personCerts.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Certifications
                        </p>
                        <div className="space-y-1">
                          {personCerts.map((cert) => (
                            <div key={cert.id} className="text-sm">
                              <p className="font-medium">{cert.name}</p>
                              <p className="text-muted-foreground text-xs">
                                {cert.issuer}
                                {cert.expiry_date && ` • Expires ${new Date(cert.expiry_date).toLocaleDateString()}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
        })}
      </div>
    </div>
  );
}
