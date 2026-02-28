import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertCircle, Video, FileText, Map, Settings, Users } from "lucide-react";

export default function Help() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Help & Documentation</h1>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Welcome to the AI Traffic Violation Detection System. This guide will help you
            navigate and use the system effectively.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                How to Verify Violations
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Navigate to the Violations page from the sidebar</li>
                  <li>Review pending violations in the table</li>
                  <li>Click the eye icon to view violation details</li>
                  <li>Review the evidence (image/video)</li>
                  <li>Click the checkmark to confirm or X to dismiss</li>
                  <li>The system will update the violation status accordingly</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Monitoring Live Camera Feeds
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to the Live Monitoring page</li>
                  <li>View all connected cameras with their status indicators</li>
                  <li>Active cameras show a green badge</li>
                  <li>Click "Open Feed" to view full-screen feed</li>
                  <li>AI detections will appear as overlays on the video</li>
                  <li>Use "Verify Violation" or "Mark False Detection" buttons as needed</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Adding Custom Violations
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Navigate to Add Violation page</li>
                  <li>Enter the vehicle number plate</li>
                  <li>Select the violation type from the dropdown</li>
                  <li>Specify the location</li>
                  <li>Upload evidence snapshot (optional)</li>
                  <li>Add remarks if needed</li>
                  <li>Click Submit to save the violation</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Searching Vehicle History
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to Vehicle History page</li>
                  <li>Enter the vehicle number in the search bar</li>
                  <li>Click Search or press Enter</li>
                  <li>View complete violation history for that vehicle</li>
                  <li>See total fines, paid amount, and pending amount</li>
                  <li>Export the report as PDF or Excel if needed</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Generating Reports
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Access Reports & Statistics page</li>
                  <li>Select filters: time period, violation type, location</li>
                  <li>View various charts showing trends and patterns</li>
                  <li>Review summary statistics at the bottom</li>
                  <li>Click Export Report to download as PDF or Excel</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="flex items-center gap-2">
                <Map className="w-5 h-5 text-primary" />
                Using the Map View
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Navigate to Map View page</li>
                  <li>See all camera locations on the interactive map</li>
                  <li>Green markers indicate active cameras</li>
                  <li>Red markers indicate offline cameras</li>
                  <li>Click on any marker to see camera details</li>
                  <li>Use filters on the right to show/hide camera types</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Configuring System Settings
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to Settings page (Admin only)</li>
                  <li>Update fine prices for each violation type</li>
                  <li>Configure SMS and Email gateway API keys</li>
                  <li>Set database sync schedule</li>
                  <li>Adjust data retention period</li>
                  <li>Switch system language (English/Urdu)</li>
                  <li>Click Save Changes to apply settings</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Managing Users
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Access User Management page (Admin only)</li>
                  <li>View all system users and their roles</li>
                  <li>Click Add User to create a new account</li>
                  <li>Use Edit icon to modify user details</li>
                  <li>Assign roles: Officer or Admin</li>
                  <li>Set user status to Active or Inactive</li>
                  <li>Delete users if necessary</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            For technical support or additional assistance, please contact the IT department
            at <strong>support@traffic.gov</strong> or call <strong>+92-51-9999999</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
