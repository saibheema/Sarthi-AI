
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Dimensions
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { BotSettings as BotSettingsType, Message, UserProfile } from './types';
import { geminiService } from './services/gemini';
import { firestoreService } from './services/firebase';
import ChatContainer from './components/ChatContainer';
import Auth from './components/Auth';
import { AgnosticLayout } from './components/AgnosticLayout';
import { VideoGenerator } from './components/VideoGenerator';
import tw from 'twrnc';

const USER_ICONS = ['🦁', '🦊', '🦄', '🐼', '🐨', '🐸', '🦉', '🐯', '🚀', '⭐'];

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userIcon] = useState(USER_ICONS[Math.floor(Math.random() * USER_ICONS.length)]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const isRequesting = useRef(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Sync session on auth
  const handleAuth = async (profile: UserProfile) => {
    console.log("[App] Auth successful for:", profile.email);
    setUser(profile);
    try {
      const userSessions = await firestoreService.getSessions(profile.id);
      if (userSessions && userSessions.length > 0) {
        setSessionId(userSessions[0].id);
        setMessages(userSessions[0].messages || []);
      } else {
        const id = `session_${Date.now()}`;
        setSessionId(id);
        setMessages([]);
      }
    } catch (e) {
      console.warn("[App] Session sync failed, starting fresh.");
      setSessionId(`session_${Date.now()}`);
    }
  };

  const startNewSession = () => {
    setSessionId(`session_${Date.now()}`);
    setMessages([]);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    setUser(null);
    setSessionId(null);
    setMessages([]);
    setShowProfileMenu(false);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sarathi needs gallery access to see images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setCurrentImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e) {
      console.error("[App] pickImage error:", e);
      Alert.alert("Error", "Could not open gallery.");
    }
  };

  const handleSendMessage = async () => {
    const txt = inputText.trim();
    console.log("[App] handleSendMessage ->", { hasText: !!txt, hasImg: !!currentImage, isBusy: isRequesting.current });

    if ((!txt && !currentImage) || !user || !sessionId) return;
    if (isRequesting.current) return;

    isRequesting.current = true;
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: txt,
      timestamp: Date.now(),
      image: currentImage || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setCurrentImage(null);

    try {
      // Small delay to allow UI state to settle before heavy API task
      await new Promise(r => setTimeout(r, 100));

      const response = await geminiService.chat(txt, messages, { name: 'SARATHI', personality: 'mentor' }, user, userMsg.image);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);

      firestoreService.saveSession({
        id: sessionId,
        userId: user.id,
        botName: 'SARATHI',
        messages: [...messages, userMsg, botMsg],
        lastUpdated: Date.now()
      }).catch(err => console.warn("[App] Firestore sync error:", err.message));

    } catch (error: any) {
      console.error("[App] Agent Error:", error.message);
      Alert.alert("Sarathi Paused", error.message || "Connection lost. Try again!");
    } finally {
      setIsLoading(false);
      isRequesting.current = false;
    }
  };

  return (
    <SafeAreaProvider>
      {!user ? (
        <Auth onAuth={handleAuth} />
      ) : (
        <AgnosticLayout
          headerContent={
            <>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-8 h-8 bg-indigo-600 rounded-xl items-center justify-center shadow-md`}>
                  <Text style={tw`text-white font-black text-base`}>S</Text>
                </View>
                <View>
                  <Text style={tw`text-sm font-black text-indigo-900`}>SARATHI</Text>
                </View>
              </View>

              <View style={tw`flex-row gap-3`}>
                <TouchableOpacity
                  onPress={() => setShowVideoGenerator(true)}
                  activeOpacity={0.7}
                  style={tw`w-10 h-10 bg-white/50 rounded-full items-center justify-center border border-white/60 shadow-sm`}
                >
                  <Text style={tw`text-lg`}>🎬</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowProfileMenu(true)}
                  activeOpacity={0.7}
                  style={tw`w-10 h-10 bg-white/50 rounded-full items-center justify-center border border-white/60 shadow-sm`}
                >
                  <Text style={tw`text-xl`}>{userIcon}</Text>
                </TouchableOpacity>
              </View>
            </>
          }
        >
          {/* Profile Modal */}
          <Modal visible={showProfileMenu} transparent animationType="fade">
            <Pressable style={tw`flex-1 bg-black/10 items-end p-4`} onPress={() => setShowProfileMenu(false)}>
              <View style={tw`mt-12 rounded-3xl w-56 shadow-2xl overflow-hidden border border-white/40`}>
                <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
                <View style={tw`bg-indigo-600/95 p-6 items-center`}>
                  <View style={tw`w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-2`}>
                    <Text style={tw`text-4xl`}>{userIcon}</Text>
                  </View>
                  <Text style={tw`text-white font-black text-sm`}>{user.name}</Text>
                  <Text style={tw`text-indigo-100 text-[9px] font-bold`}>{user.email}</Text>
                </View>
                <View style={tw`p-2`}>
                  <TouchableOpacity onPress={startNewSession} style={tw`flex-row items-center gap-3 p-4`}>
                    <Text style={tw`text-lg`}>🔄</Text>
                    <Text style={tw`text-slate-800 font-bold text-xs`}>New Session</Text>
                  </TouchableOpacity>
                  <View style={tw`h-px bg-slate-200/50 mx-4`} />
                  <TouchableOpacity onPress={handleLogout} style={tw`flex-row items-center gap-3 p-4`}>
                    <Text style={tw`text-lg`}>🚪</Text>
                    <Text style={tw`text-red-500 font-bold text-xs`}>Exit Portal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Modal>

          <SafeAreaView style={tw`flex-1`} edges={['bottom']}>
            <View style={tw`flex-1`}>
              <ChatContainer messages={messages} isLoading={isLoading} />

              {/* INPUT BAR - WhatsApp-style positioning */}
              <View style={[
                tw`absolute left-0 right-0 px-4`,
                {
                  bottom: Platform.OS === 'ios'
                    ? (isKeyboardVisible ? keyboardHeight + 10 : 34)
                    : 24,
                  backgroundColor: 'transparent'
                }
              ]}>
                <View style={tw`relative rounded-[32px] overflow-hidden shadow-2xl border border-white/50 bg-white/10`}>
                  <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />

                  {currentImage && (
                    <View style={tw`p-3 flex-row`}>
                      <View style={tw`relative`}>
                        <Image source={{ uri: currentImage }} style={tw`w-16 h-16 rounded-xl border-2 border-white shadow-sm`} />
                        <TouchableOpacity
                          onPress={() => setCurrentImage(null)}
                          style={tw`absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full items-center justify-center border-2 border-white`}
                        >
                          <Text style={tw`text-white text-[10px] font-bold`}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={tw`flex-row items-center gap-2 h-16 px-4`}>
                    <TouchableOpacity
                      onPress={pickImage}
                      activeOpacity={0.6}
                      style={tw`w-10 h-10 items-center justify-center rounded-full bg-white/40 border border-white/20`}
                    >
                      <Text style={tw`text-xl`}>📷</Text>
                    </TouchableOpacity>

                    <TextInput
                      value={inputText}
                      onChangeText={setInputText}
                      placeholder="Ask Sarathi anything..."
                      placeholderTextColor="#94a3b8"
                      style={tw`flex-1 h-full text-[15px] font-bold text-slate-800`}
                      onSubmitEditing={handleSendMessage}
                      returnKeyType="send"
                      blurOnSubmit={false}
                      multiline={false}
                    />

                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Voice Feature - Coming Soon',
                          'The voice conversation feature is currently under development. We\'re working hard to bring you an amazing voice interaction experience!\n\nStay tuned for updates.',
                          [
                            {
                              text: 'OK',
                              style: 'default'
                            }
                          ]
                        );
                      }}
                      activeOpacity={0.6}
                      style={tw`w-10 h-10 items-center justify-center rounded-full bg-indigo-100/50 border border-white/10`}
                    >
                      <Text style={tw`text-xl`}>🎙️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSendMessage}
                      disabled={isLoading}
                      activeOpacity={0.7}
                      style={[
                        tw`w-12 h-12 bg-indigo-600 rounded-full items-center justify-center shadow-lg`,
                        isLoading ? tw`opacity-40` : tw`shadow-indigo-300`
                      ]}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={tw`text-white text-xl font-bold`}>→</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </SafeAreaView>

          {/* VIDEO GENERATOR MODAL */}
          {showVideoGenerator && (
            <Modal visible={showVideoGenerator} animationType="slide">
              <VideoGenerator
                onClose={() => setShowVideoGenerator(false)}
                onVideoGenerated={(videoPath) => {
                  console.log('[App] Video generated:', videoPath);
                  // You can add logic here to share or display the generated video
                }}
              />
            </Modal>
          )}
        </AgnosticLayout>
      )}
    </SafeAreaProvider>
  );
};

export default App;
