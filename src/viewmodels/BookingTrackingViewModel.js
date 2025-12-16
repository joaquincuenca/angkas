import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookingService } from '../services/BookingService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function useBookingTracking() {
    const { bookingNumber } = useParams();
    const navigate = useNavigate();
    
    // State
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [lastStatus, setLastStatus] = useState(null);
    const [statusUpdateTime, setStatusUpdateTime] = useState(null);
    
    // Chat states
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatLoading, setChatLoading] = useState(false);
    const [userRole, setUserRole] = useState('client');
    
    // Refs
    const pollingRef = useRef(null);
    const audioRef = useRef(null);
    const chatAudioRef = useRef(null);
    const statusChangedRef = useRef(false);
    const hasFetchedRef = useRef(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const riderLocationPollingRef = useRef(null);

    const [riderLocation, setRiderLocation] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    // Initialize tracking - FIXED: Only run once
    useEffect(() => {
        if (bookingNumber && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            initializeTracking();
        }
        
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
            if (riderLocationPollingRef.current) {
                clearInterval(riderLocationPollingRef.current);
            }
        };
    }, [bookingNumber]);

    const fetchRiderLocation = useCallback(async () => {
        if (!bookingNumber) {
            console.log('No booking number');
            return;
        }

        // Check if booking exists
        if (!booking) {
            console.log('Booking not loaded yet');
            return;
        }

        // Stop fetching if booking is finished - clear interval too
        if (booking.status === 'completed' || booking.status === 'cancelled') {
            if (riderLocationPollingRef.current) {
                clearInterval(riderLocationPollingRef.current);
                riderLocationPollingRef.current = null;
            }
            setRiderLocation(null);
            return;
        }

        const activeStatuses = ['confirmed', 'assigned', 'in_progress', 'on_the_way', 'picked_up', 'in_transit'];
        if (!activeStatuses.includes(booking.status)) {
            console.log('Booking not in active tracking status:', booking.status);
            return;
        }

        // Check if rider is assigned
        if (!booking.assigned_rider_id) {
            console.log('No rider assigned to this booking');
            setRiderLocation(null);
            return;
        }

        try {
            const result = await BookingService.getRiderLocation(bookingNumber);
            
            // ✅ UPDATED: Check for success property
            if (result.success && result.data) {
                const newLocation = {
                    lat: result.data.latitude,
                    lng: result.data.longitude,
                    heading: result.data.heading,
                    speed: result.data.speed,
                    timestamp: result.data.timestamp
                };
                
                // Only update if location actually changed
                if (!riderLocation || 
                    newLocation.lat !== riderLocation.lat || 
                    newLocation.lng !== riderLocation.lng) {
                    setRiderLocation(newLocation);
                }
            } else {
                // ✅ UPDATED: Handle error responses gracefully
                if (result.error) {
                    // Only log non-routine errors
                    if (!result.error.includes('No rider assigned') && 
                        !result.error.includes('No location data available') &&
                        !result.error.includes('not trackable')) {
                        console.warn('⚠️ Location tracking issue:', result.error);
                    }
                }
                // Don't set location to null if there's an error - keep last known position
            }
        } catch (error) {
            // ✅ UPDATED: Better error handling
            // Only log unexpected errors
            console.log('📍 Location fetch info:', error.message);
        }
    }, [bookingNumber, booking, riderLocation]);

    // FIXED: Proper rider location polling with dependencies
    useEffect(() => {
        // Clear any existing interval
        if (riderLocationPollingRef.current) {
            clearInterval(riderLocationPollingRef.current);
            riderLocationPollingRef.current = null;
        }

        // ADD THIS CHECK: If booking is not loaded yet, don't do anything
        if (!booking) {
            return;
        }

        // Only start polling if booking is in active status
        if (!['confirmed', 'assigned', 'in_progress', 'on_the_way', 'picked_up', 'in_transit'].includes(booking.status)) {
            console.log('Not polling rider location - booking status:', booking.status);
            setRiderLocation(null);
            return;
        }

        // Check if rider is assigned
        if (!booking.assigned_rider_id) {
            console.log('Not polling rider location - no rider assigned');
            setRiderLocation(null);
            return;
        }
        
        // Initial fetch
        fetchRiderLocation();

        // Poll every 5 seconds
        riderLocationPollingRef.current = setInterval(() => {
            fetchRiderLocation();
        }, 5000);

        return () => {
            if (riderLocationPollingRef.current) {
                clearInterval(riderLocationPollingRef.current);
                riderLocationPollingRef.current = null;
            }
        };

        
        }, [booking, bookingNumber, fetchRiderLocation]); // REMOVED fetchRiderLocation and simplified dependencies

    // Get user's current location - FIXED: Only run once
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.log('Geolocation error:', error);
                }
            );
        }
    }, []);

    const initializeTracking = async () => {
        try {
            await loadBooking();
            await loadMessages();
            subscribeToUpdates();
            subscribeToMessages();
            setupPolling();
            
            // Load notification sounds
            audioRef.current = new Audio('/notification.mp3');
            audioRef.current.volume = 0.3;
            
            chatAudioRef.current = new Audio('/message-notification.mp3');
            chatAudioRef.current.volume = 0.3;
            
            // Set user role
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            setUserRole(userData.role || 'client');
            
        } catch (err) {
            console.error('Failed to initialize tracking:', err);
            setError(err.message);
        }
    };

    // Status change detection
    useEffect(() => {
        if (booking) {
            if (lastStatus && booking.status !== lastStatus) {
                statusChangedRef.current = true;
                setStatusUpdateTime(new Date().toISOString());
                playStatusChangeSound(booking.status);
            }
            setLastStatus(booking.status);
        }
    }, [booking]);

    // FIXED: Setup polling with useCallback
    const setupPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        
        if (autoRefresh && booking && booking.status !== 'completed' && booking.status !== 'cancelled') {
            pollingRef.current = setInterval(() => {
                if (!isRefreshing) {
                    loadBooking();
                }
            }, 5000);
            
            // Initial refresh after 1 second
            setTimeout(() => {
                loadBooking();
            }, 1000);
        }
    }, [autoRefresh, booking, isRefreshing]);

    useEffect(() => {
        setupPolling();
    }, [setupPolling]);

    // FIXED: Wrap loadBooking in useCallback
    const loadBooking = useCallback(async () => {
        if (!bookingNumber) return;
        
        try {
            setIsRefreshing(true);
            const data = await BookingService.getBookingByNumber(bookingNumber);
            if (!data) throw new Error('Booking not found');
            
            const bookingWithDefaults = {
                ...data,
                user_details: data.user_details || {}
            };
            
            setBooking(bookingWithDefaults);
            setError(null);
        } catch (err) {
            console.error('Error loading booking:', err);
            setError(err.message || 'Failed to load booking');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [bookingNumber]);

    // FIXED: Subscribe to updates with proper cleanup
    const subscribeToUpdates = () => {
        if (!bookingNumber) return;
        
        try {
            const channel = supabase
                .channel(`public:bookings:booking_number=eq.${bookingNumber}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'bookings',
                        filter: `booking_number=eq.${bookingNumber}`
                    },
                    async (payload) => {
                        try {
                            const updatedBooking = await BookingService.getBookingByNumber(bookingNumber);
                            const bookingWithDetails = {
                                ...updatedBooking,
                                user_details: updatedBooking.user_details || {
                                    fullName: updatedBooking.user_name || '',
                                    contactNumber: updatedBooking.user_phone || ''
                                }
                            };
                            
                            setBooking(bookingWithDetails);
                            
                            if (payload.old?.status !== payload.new.status) {
                                playStatusChangeSound(payload.new.status);
                            }
                        } catch (fetchError) {
                            console.error('Error fetching updated booking:', fetchError);
                            const bookingFromPayload = {
                                ...payload.new,
                                user_details: {
                                    fullName: payload.new.user_name || '',
                                    contactNumber: payload.new.user_phone || ''
                                }
                            };
                            setBooking(bookingFromPayload);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } catch (err) {
            console.error('Error setting up subscription:', err);
        }
    };

    // Chat operations
    const loadMessages = async () => {
        if (!bookingNumber) return;
        
        try {
            setChatLoading(true);
            const { data, error } = await supabase
                .from('booking_messages')
                .select('*')
                .eq('booking_number', bookingNumber)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            
            setMessages(data || []);
            
            if (showChat) {
                markMessagesAsRead();
            } else {
                const unread = data?.filter(msg => 
                    !msg.is_read && msg.sender_role !== userRole
                ).length || 0;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error('Error loading messages:', err);
        } finally {
            setChatLoading(false);
        }
    };

    const subscribeToMessages = () => {
        if (!bookingNumber) return;
        
        try {
            const channel = supabase
                .channel(`messages-${bookingNumber}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'booking_messages',
                        filter: `booking_number=eq.${bookingNumber}`
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            setMessages(prev => [...prev, payload.new]);
                            
                            if (payload.new.sender_role !== userRole) {
                                playMessageSound();
                                
                                if (!showChat) {
                                    setUnreadCount(prev => prev + 1);
                                    
                                    if ("Notification" in window && Notification.permission === "granted") {
                                        new Notification(`New Message - Booking #${bookingNumber}`, {
                                            body: `${payload.new.sender_role === 'admin' ? 'Admin' : 'Customer'}: ${payload.new.message}`,
                                            icon: '/favicon.ico'
                                        });
                                    }
                                } else {
                                    markMessageAsRead(payload.new.id);
                                }
                            }
                        }
                    }
                )
                .subscribe();
            
            return () => {
                supabase.removeChannel(channel);
            };
        } catch (err) {
            console.error('Error subscribing to messages:', err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !bookingNumber) return;
        
        try {
            setIsSendingMessage(true);
            
            const messageData = {
                booking_number: bookingNumber,
                message: newMessage.trim(),
                sender_role: userRole,
                sender_id: userRole === 'admin' ? 'admin' : booking?.user_id || 'client',
                is_read: false
            };
            
            const { error } = await supabase
                .from('booking_messages')
                .insert([messageData]);
            
            if (error) throw error;
            
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
            throw err;
        } finally {
            setIsSendingMessage(false);
        }
    };

    const markMessagesAsRead = async () => {
        if (messages.length === 0) return;
        
        try {
            const unreadMessageIds = messages
                .filter(msg => !msg.is_read && msg.sender_role !== userRole)
                .map(msg => msg.id);
            
            if (unreadMessageIds.length > 0) {
                const { error } = await supabase
                    .from('booking_messages')
                    .update({ is_read: true })
                    .in('id', unreadMessageIds);
                
                if (error) throw error;
                
                setMessages(prev => prev.map(msg => 
                    unreadMessageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
                ));
            }
            
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    };

    const markMessageAsRead = async (messageId) => {
        try {
            const { error } = await supabase
                .from('booking_messages')
                .update({ is_read: true })
                .eq('id', messageId);
            
            if (error) throw error;
            
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, is_read: true } : msg
            ));
        } catch (err) {
            console.error('Error marking message as read:', err);
        }
    };

    // Booking actions
    const handleCancelBooking = async () => {
        if (!booking || !bookingNumber) return;
        
        try {
            setIsCancelling(true);
            setShowCancelConfirm(false);
            
            const result = await BookingService.cancelBooking(bookingNumber);
            if (result.success) {
                setBooking(prev => ({ ...prev, status: 'cancelled' }));
                setAutoRefresh(false);
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                }
                if (riderLocationPollingRef.current) {
                    clearInterval(riderLocationPollingRef.current);
                }
            } else {
                throw new Error(result.message || 'Failed to cancel booking');
            }
        } catch (err) {
            console.error('Error cancelling booking:', err);
            throw err;
        } finally {
            setIsCancelling(false);
        }
    };

    // Helper functions
    const playMessageSound = () => {
        if (chatAudioRef.current) {
            chatAudioRef.current.currentTime = 0;
            chatAudioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
    };

    const playStatusChangeSound = (status) => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
        
        if ("Notification" in window && Notification.permission === "granted") {
            const statusMessages = {
                'pending': 'Waiting for driver to accept...',
                'confirmed': '🚗 Driver has accepted your booking!',
                'completed': '✅ Ride completed successfully!',
                'cancelled': '❌ Booking has been cancelled'
            };
            
            new Notification(`Booking #${bookingNumber}`, {
                body: `Status changed to ${status}: ${statusMessages[status]}`,
                icon: '/favicon.ico'
            });
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'confirmed': return '✅';
            case 'completed': return '🎉';
            case 'cancelled': return '❌';
            default: return '📋';
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case 'pending': return 'Waiting for driver to accept...';
            case 'confirmed': return 'Driver has accepted your booking!';
            case 'completed': return 'Ride completed successfully!';
            case 'cancelled': return 'Booking has been cancelled.';
            default: return 'Booking received.';
        }
    };

    const getEstimatedTime = (status) => {
        if (status === 'pending') return '5-10 minutes';
        if (status === 'confirmed') return '3-5 minutes';
        if (status === 'completed') return 'Arrived';
        return 'N/A';
    };

    const formatUserDetails = (userDetails) => {
        if (!userDetails) return null;
        return {
            name: userDetails.fullName || userDetails.name || 'Not provided',
            contact: userDetails.contactNumber || userDetails.phone || 'Not provided'
        };
    };

    const retryLoading = () => {
        setLoading(true);
        setError(null);
        loadBooking();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (showChat) {
            scrollToBottom();
            markMessagesAsRead();
        }
    }, [showChat, messages]);

    return {
        // State
        booking,
        loading,
        error,
        isRefreshing,
        autoRefresh,
        isCancelling,
        showCancelConfirm,
        lastStatus,
        statusUpdateTime,
        messages,
        newMessage,
        isSendingMessage,
        showChat,
        unreadCount,
        chatLoading,
        userRole,
        statusChangedRef,
        messagesEndRef,
        
        // Actions
        setAutoRefresh,
        setShowCancelConfirm,
        setShowChat,
        setNewMessage,
        
        // Functions
        loadBooking,
        sendMessage,
        handleCancelBooking,
        getStatusIcon,
        getStatusMessage,
        getEstimatedTime,
        formatUserDetails,
        retryLoading,
        
        // Navigation
        navigate,
        bookingNumber,

        riderLocation,
        userLocation,
        fetchRiderLocation
    };
}