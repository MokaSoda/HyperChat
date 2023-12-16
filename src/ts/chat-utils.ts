export const getFrameInfoAsync = async (): Promise<Chat.UncheckedFrameInfo> => {
  return await new Promise(
    (resolve) =>
      chrome.runtime.sendMessage({ type: 'getFrameInfo' }, resolve)
  );
};

export const createPopup = (url: string): void => {
  chrome.runtime.sendMessage({ type: 'createPopup', url });
};

export const frameIsReplay = (): boolean => {
  try {
    return window.location.href.startsWith(
      `${(location.protocol + '//' + location.host)}/live_chat_replay`
    );
  } catch (e) {
    return false;
  }
};

/*
 * Type predicates
 */
export const isPaidMessageRenderer =
  (r: Ytc.Renderers): r is Ytc.PaidMessageRenderer =>
    'purchaseAmountText' in r && 'bodyBackgroundColor' in r;

export const isPaidStickerRenderer =
  (r: Ytc.Renderers): r is Ytc.PaidStickerRenderer =>
    'purchaseAmountText' in r && 'moneyChipBackgroundColor' in r;

export const isMembershipRenderer =
  (r: Ytc.Renderers): r is Ytc.MembershipRenderer => 'headerSubtext' in r;

/** Checks if frameInfo values are valid */
export const isValidFrameInfo = (f: Chat.UncheckedFrameInfo, port?: Chat.Port): f is Chat.FrameInfo => {
  const check = f.tabId != null && f.frameId != null;
  if (!check) {
    console.error('Invalid frame info', { port });
  }
  return check;
};

const actionTypes = new Set(['messages', 'bonk', 'delete', 'pin', 'unpin', 'playerProgress', 'forceUpdate']);
export const responseIsAction = (r: Chat.BackgroundResponse): r is Chat.Actions =>
  actionTypes.has(r.type);

export const isMembershipGiftPurchaseRenderer = (r: Ytc.Renderers): r is Ytc.MembershipGiftPurchaseRenderer =>
  'header' in r && 'liveChatSponsorshipsHeaderRenderer' in r.header;

const privilegedTypes = new Set(['member', 'moderator', 'owner']);
export const isPrivileged = (types: string[]): boolean =>
  types.some(privilegedTypes.has.bind(privilegedTypes));

export const isChatMessage = (a: Chat.MessageAction): boolean =>
  !a.message.superChat && !a.message.superSticker && !a.message.membership;

export const isAllEmoji = (a: Chat.MessageAction): boolean =>
  a.message.message.length !== 0 &&
  a.message.message.every(m => m.type === 'emoji' || (m.type === 'text' && m.text.trim() === ''));

export const isLang = (a: Chat.MessageAction, isalsouser: boolean, isalsouser_aggressive: boolean, ischataggressive: boolean): boolean => {
  let result;
  let text_compiled = ""
  let array_result = [];

  // console.log(a.message.message)
  // console.log(a)
  for (const payload of a.message.message){
    if (payload['type'] == 'text'){
      text_compiled += payload['text'];
    }
  }
  if (isalsouser && isalsouser_aggressive){
    let result_user;
    let array_user = [...a.message.author.name];
    for (const langchar of array_user){
      chrome.i18n.detectLanguage(langchar, tmp_test => result_user = tmp_test);
      for (const langstr of Object.values(result_user)[1]) {
        // console.log(langstr);
        array_result.push(langstr['language']);
    }
  }
  }
  if (isalsouser && !isalsouser_aggressive){
    let result_user;
    chrome.i18n.detectLanguage(a.message.author.name, tmp_test => result_user = tmp_test);
    for (const langstr of Object.values(result_user)[1]) {
      // console.log(langstr);
      array_result.push(langstr['language']);
    }
  }
  
  if (ischataggressive){
    let array_message = [...text_compiled];
    for (const message_char of array_message){
      chrome.i18n.detectLanguage(message_char, tmp_test => result = tmp_test);
      for (const langstr of Object.values(result)[1]) {
        // console.log(langstr);
        array_result.push(langstr['language']);
      }
    }
  }

  else{
    chrome.i18n.detectLanguage(text_compiled, tmp_test => result = tmp_test);
    for (const langstr of Object.values(result)[1]) {
        // console.log(langstr);
        array_result.push(langstr['language']);
    }
  }
  // console.log(text_compiled)
  // return false
  let language_array = ['ko','zh-CN'];
  let result_lang_det = [];
  for (const langcode of language_array){
    result_lang_det.push(array_result.includes(langcode));
  }
  let sum_boolean = result_lang_det.reduce((accumulator, currentValue) => {
    return accumulator + currentValue;
  },0);

  if (sum_boolean) {
      return true;
  } else {
      return false;
  }

}
  
export const checkInjected = (error: string): boolean => {
  if (document.querySelector('#hc-buttons')) {
    console.error(error);
    return true;
  }
  return false;
};

export const useReconnect = <T extends Chat.Port>(connect: () => T): T & { destroy: () => void } => {
  let actualPort = connect();
  const onDisconnect = (): void => {
    actualPort = connect();
    actualPort.onDisconnect.addListener(onDisconnect);
  };
  actualPort.onDisconnect.addListener(onDisconnect);

  return {
    ...actualPort,
    get name() { return actualPort.name; },
    get disconnect() { return actualPort.disconnect; },
    get postMessage() { return actualPort.postMessage; },
    get onMessage() { return actualPort.onMessage; },
    get onDisconnect() { return actualPort.onDisconnect; },
    destroy: () => {
      actualPort.onDisconnect.removeListener(onDisconnect);
      actualPort.disconnect();
    }
  };
};
