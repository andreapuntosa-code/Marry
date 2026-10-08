// Shots of the vertical Short (1080x1920): existing film shots, rendered portrait at hero quality
export const SHORT = [];
const reg = (name, dur, id) => SHORT.push({ name, dur, id });
reg('comment', 4.0, 'i06a');
reg('religion', 3.6, 'b20i');
reg('ladder', 3.6, 'l09');
reg('top', 3.6, 'e04');
reg('screen', 3.6, 'e11');
reg('crew', 3.6, 'e19');
reg('end', 4.0, 'outro_bg');
window.SHORT = SHORT;
