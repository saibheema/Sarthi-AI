import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import tw from 'twrnc';

interface VideoGeneratorProps {
  onClose: () => void;
  onVideoGenerated?: (videoPath: string) => void;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  onClose,
  onVideoGenerated,
}) => {

  const generateVideo = async () => {
    // Show "in construction" message
    Alert.alert(
      'Video Generation - In Construction',
      'The video generation feature is currently under development. We\'re working hard to bring you this amazing feature soon!\n\nStay tuned for updates.',
      [
        {
          text: 'OK',
          style: 'default'
        }
      ]
    );
  };

  return (
    <View style={tw`flex-1 bg-black/50`}>
      <BlurView intensity={100} tint="dark" style={tw`flex-1`}>
        <View style={tw`flex-1 p-6 pt-12`}>
          {/* Header */}
          <View style={tw`flex-row items-center justify-between mb-6`}>
            <Text style={tw`text-white text-2xl font-bold`}>Video Generator</Text>
            <TouchableOpacity
              onPress={onClose}
              style={tw`w-10 h-10 bg-white/20 rounded-full items-center justify-center`}
            >
              <Text style={tw`text-white text-xl font-bold`}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
            {/* Construction Message */}
            <View style={tw`bg-white/10 rounded-2xl p-6 mb-6 items-center justify-center min-h-80`}>
              <View style={tw`bg-orange-500/20 border border-orange-500/30 rounded-full p-4 mb-6`}>
                <Text style={tw`text-orange-400 text-4xl`}>🚧</Text>
              </View>

              <Text style={tw`text-white text-2xl font-bold mb-4 text-center`}>
                Video Generation
              </Text>

              <Text style={tw`text-white text-lg font-semibold mb-2 text-center`}>
                In Construction
              </Text>

              <Text style={tw`text-white/80 text-base text-center leading-6 mb-6 px-4`}>
                We're working hard to bring you an amazing video generation feature that will create educational videos from your topics automatically.
              </Text>

              <Text style={tw`text-white/60 text-sm text-center mb-6 px-4`}>
                This feature will be available soon. Stay tuned for updates!
              </Text>

              <TouchableOpacity
                onPress={generateVideo}
                style={tw`bg-orange-600 rounded-xl py-4 px-8 items-center`}
              >
                <Text style={tw`text-white text-lg font-semibold`}>
                  Coming Soon
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </View>
  );
};