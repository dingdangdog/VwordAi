const say = require('say');

console.log('Available voices:');
say.getInstalledVoices((err, voices) => {
  if (err) {
    console.error('Error getting voices:', err);
  } else {
    console.log(voices);
    
    // Test with Microsoft Huihui voice
    if (voices.includes('Microsoft Huihui Desktop')) {
      console.log('\nTesting Chinese with Microsoft Huihui Desktop:');
      say.speak('测试中文语音，希望这次能正常工作', 'Microsoft Huihui Desktop', 1.0, (err) => {
        if (err) {
          console.error('Speech error:', err);
        } else {
          console.log('Speech completed successfully');
        }
      });
    } else {
      console.log('Microsoft Huihui Desktop not available');
    }
    
    // Test with default voice
    console.log('\nTesting Chinese with default voice:');
    say.speak('测试中文语音，默认语音', null, 1.0, (err) => {
      if (err) {
        console.error('Speech error:', err);
      } else {
        console.log('Speech completed successfully');
      }
    });
  }
}); 