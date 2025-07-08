'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiClient, PublicIntakePageData, IntakeFormSubmissionData, AvailabilityResponse, AvailableTimeSlot, BookingRequest, getClientTimezone } from '@/lib/api';
import { Loader2, CheckCircle, AlertCircle, Calendar, Clock } from 'lucide-react';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { ConfirmationDialog } from '@/components/booking/ConfirmationDialog';

export default function PublicIntakeForm() {
  const params = useParams();
  const router = useRouter();
  const firmId = params.firmId as string;

  const [pageData, setPageData] = useState<PublicIntakePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  
  // Booking states
  const [showBooking, setShowBooking] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [confirmedSlot, setConfirmedSlot] = useState<AvailableTimeSlot | null>(null);
  const [selectedSlotForConfirmation, setSelectedSlotForConfirmation] = useState<AvailableTimeSlot | null>(null);

  const [formData, setFormData] = useState<IntakeFormSubmissionData>({
    client_name: '',
    client_email: '',
    client_phone: '',
    case_type_id: '',
    description: '',
    client_timezone: getClientTimezone(), // Auto-detect client timezone
  });

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getPublicIntakePageData(firmId);
        setPageData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load intake form');
      } finally {
        setLoading(false);
      }
    };

    if (firmId) {
      fetchPageData();
    }
  }, [firmId]);

  const handleInputChange = (field: keyof IntakeFormSubmissionData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.client_email || !formData.case_type_id || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await apiClient.submitPublicIntakeForm(firmId, formData);
      console.log('Form submitted successfully:', response);
      
      // Store case ID and trigger booking flow
      setCaseId(response.case_id);
      setSubmitted(true);
      setShowBooking(true);
      
      // Fetch availability for booking
      await fetchAvailability();
    } catch (err) {
      // Better error handling for validation errors
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit intake form. Please check all fields and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      setLoadingAvailability(true);
      setError(null);
      
      const availabilityData = await apiClient.getPublicAvailability(firmId);
      setAvailability(availabilityData);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to load available time slots');
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleSlotSelection = (slot: AvailableTimeSlot) => {
    setSelectedSlotForConfirmation(slot);
  };

  const handleConfirmBooking = async () => {
    if (!caseId || !selectedSlotForConfirmation) {
      setError('An error occurred. Please try again.');
      return;
    }

    try {
      setBookingSubmitting(true);
      setError(null);

      const bookingRequest: BookingRequest = {
        start_time: selectedSlotForConfirmation.start_time,
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_timezone: formData.client_timezone,
      };

      const response = await apiClient.createPublicBooking(caseId, bookingRequest);
      console.log('Booking created successfully:', response);

      setConfirmedSlot(selectedSlotForConfirmation);
      setMeetingLink(response.meeting_link || null);
      setBookingComplete(true);
      setSelectedSlotForConfirmation(null);
    } catch (err) {
      console.error('Booking creation error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create booking. Please try again.');
      }
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleCancelConfirmation = () => {
    setSelectedSlotForConfirmation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading intake form...</span>
        </div>
      </div>
    );
  }

  if (error && !pageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted && showBooking) {
    if (bookingComplete) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Booking Confirmed!</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Your intake form has been submitted and your appointment has been scheduled successfully.
              </p>
              {confirmedSlot && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Appointment Details</span>
                  </div>
                  <p className="text-blue-800 text-sm">{confirmedSlot.formatted_time}</p>
                  {meetingLink && (
                    <div className="mt-2">
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Join Google Meet
                      </a>
                    </div>
                  )}
                </div>
              )}
              <p className="text-gray-600 text-sm mb-4">
                {pageData?.firm_name} will contact you if any changes are needed.
              </p>
              <Button onClick={() => window.location.reload()} className="w-full">
                Submit Another Request
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Form Submitted Successfully!</span>
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Now let&apos;s schedule your consultation with {pageData?.firm_name}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                </div>
              )}

              {loadingAvailability ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading available time slots...</span>
                  </div>
                </div>
              ) : availability && availability.available_slots.length > 0 ? (
                <>
                  <BookingCalendar
                    availability={availability.available_slots}
                    onSlotSelect={handleSlotSelection}
                    firmName={pageData?.firm_name || ''}
                    isBooking={bookingSubmitting}
                  />
                  <ConfirmationDialog
                    isOpen={!!selectedSlotForConfirmation}
                    onClose={handleCancelConfirmation}
                    onConfirm={handleConfirmBooking}
                    slot={selectedSlotForConfirmation}
                    isBooking={bookingSubmitting}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Available Time Slots
                  </h3>
                  <p className="text-gray-600 mb-4">
                    There are currently no available appointment slots. {pageData?.firm_name} will contact you directly to schedule your consultation.
                  </p>
                  <Button onClick={() => window.location.reload()} className="w-full">
                    Submit Another Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            {pageData?.logo_url && (
              <div className="mb-4">
                <img 
                  src={pageData.logo_url} 
                  alt={`${pageData.firm_name} Logo`}
                  className="h-16 mx-auto object-contain"
                />
              </div>
            )}
            <CardTitle className="text-2xl font-bold text-gray-900">
              {pageData?.firm_name}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {pageData?.welcome_message || 'Please fill out this intake form to get started.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Full Name *</Label>
                  <Input
                    id="client_name"
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">Email Address *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_phone">Phone Number</Label>
                <Input
                  id="client_phone"
                  type="tel"
                  value={formData.client_phone}
                  onChange={(e) => handleInputChange('client_phone', e.target.value)}
                  placeholder="Enter your phone number (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="case_type">Case Type *</Label>
                <Select
                  value={formData.case_type_id}
                  onValueChange={(value) => handleInputChange('case_type_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select the type of legal matter" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageData?.case_types.map((caseType) => (
                      <SelectItem key={caseType.id} value={caseType.id}>
                        <div>
                          <div className="font-medium">{caseType.name}</div>
                          {caseType.description && (
                            <div className="text-sm text-gray-500">{caseType.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Case Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Please describe your legal matter in detail. Include relevant dates, parties involved, and any other important information."
                  rows={6}
                  required
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Intake Form'
                  )}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>
                  By submitting this form, you agree to allow {pageData?.firm_name} to contact you 
                  regarding your legal matter. This does not create an attorney-client relationship.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}