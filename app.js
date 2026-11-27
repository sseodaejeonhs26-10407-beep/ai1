'use strict';

// 질문/분기/결과 데이터. [다음 질문 또는 결과, 배출 전 할 일]로 연결합니다.
// 파일을 직접 열 수 있도록 JSON 파일을 fetch하지 않고 이곳에서 관리합니다.
const CATEGORIES = [
  ['plastic','플라스틱','용기 · 페트병'], ['vinyl','비닐','봉지 · 포장 비닐'],
  ['paper','종이','상자 · 종이류'], ['carton','종이팩','우유팩 · 주스팩'],
  ['glass','유리','유리병 · 유리 제품'], ['metal','캔·고철','금속 캔 · 생활용품'],
  ['foam','스티로폼','흰색 포장재'], ['confusing','헷갈리는 쓰레기','품목별 빠른 안내']
];
const SOURCES = {
  common: ['한국소비자원 분리배출 기준','https://www.kca.go.kr/smartconsumer/sub.do?menukey=7740'],
  law: ['생활법령정보 품목별 배출 요령','https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=2&cciNo=1&cnpClsNo=2&csmSeq=1452&popMenu=ov'],
  glass: ['서대문구 분리배출 길라잡이','https://www.sdm.go.kr/downloadFile.do?oriFileNm=재활용품_분리배출_길라잡이.pdf&path=/board/106&saveFileNm=20151127_18498744812188292.pdf']
};
const r = (kind,title,place,reason,steps,source='common') => ({kind,title,place,reason,steps,source});
const RESULTS = {
  trash:r('trash','일반쓰레기로 배출해요','일반쓰레기 종량제 봉투','오염이나 재질 때문에 재활용 원료로 사용하기 어려워요.',['거주지 규격의 종량제 봉투에 넣어 배출해주세요.']),
  plastic:r('recycle','플라스틱류로 배출해요','플라스틱류 수거함','깨끗한 플라스틱 용기·포장재는 재활용 대상으로 모아요.',['남은 내용물을 비우고 헹궈주세요.','라벨·부속품 등 다른 재질을 제거해주세요.','수거함의 재질 표시와 거주지 기준에 맞춰 배출해주세요.']),
  plasticCheck:r('check','제품별 배출 기준을 확인해주세요','지자체 품목별 배출 안내','일반 플라스틱 제품은 용도·크기·복합 재질에 따라 처리 방법이 달라요.',['제품명과 재질 표시를 확인해주세요.','OTHER 표시만으로 재활용 가능 여부를 단정하지 마세요.','종량제·대형폐기물 등 제품별 처리 기준을 확인해주세요.'],'law'),
  pet:r('special','투명 페트병으로 따로 배출해요','투명 페트병 전용 수거함','무색·투명한 생수·음료 PET병은 다른 플라스틱과 구분해요.',['내용물을 비우고 헹군 뒤 라벨을 제거해주세요.','가능하면 병을 압착하고 뚜껑을 닫아주세요.','거주지의 전용 수거함 또는 별도 수거 장소에 배출해주세요.']),
  vinyl:r('recycle','비닐류로 배출해요','비닐류 수거함','이물질을 제거한 비닐 포장재를 따로 모아 재활용해요.',['남은 내용물과 이물질을 없애주세요.','흩날리지 않도록 모아 거주지 비닐 수거 기준에 맞춰 배출해주세요.']),
  paper:r('recycle','종이류로 배출해요','종이류 수거함','오염과 코팅이 없는 종이는 재활용할 수 있어요.',['다른 재질의 부속품을 제거해주세요.','종이가 젖지 않게 모아서 배출해주세요.']),
  paperCheck:r('check','부속품이 붙은 종이는 추가 확인해요','지자체 품목별 배출 안내','다른 재질이 붙어 있으면 종이류로 바로 판정하기 어려워요.',['분리할 수 있는 종이와 부속품은 나눠주세요.','분리되지 않는 부분은 제품별 배출 기준을 확인해주세요.']),
  wetPaper:r('check','젖은 상태와 오염을 구분해주세요','깨끗한 종이: 종이류 / 오염된 종이: 종량제 봉투','물에만 젖은 종이와 곰팡이·오염이 있는 종이는 배출 방법이 달라요.',['물에만 젖었다면 충분히 말려 종이류로 배출해주세요.','곰팡이나 심한 오염이 있다면 일반쓰레기로 배출해주세요.']),
  carton:r('special','종이팩 전용 수거함에 배출해요','종이팩 전용 수거함','액체를 담았던 종이팩은 일반 종이와 구분해 수거해요.',['깨끗이 헹군 종이팩을 말려서 모아주세요.','일반팩·멸균팩을 받는 수거함 표시를 확인해주세요.','전용함이 없다면 지역 안내를 확인하고, 허용하는 경우 일반 종이와 구분되게 묶어 종이류 수거함에 배출해주세요.'],'law'),
  notCarton:r('check','일반 종이 기준으로 다시 확인해요','처음부터 다시 → 종이','액체용 종이팩이 아니라면 코팅·오염 상태를 확인해야 해요.',['처음으로 돌아가 종이를 선택해주세요.','일반 종이와 함께 버리기 전에 오염·코팅 여부를 확인해주세요.']),
  glass:r('recycle','유리병류로 배출해요','유리병류 수거함','온전한 일반 유리병은 재활용 대상으로 수거해요.',['내용물을 비우고 다른 재질의 뚜껑을 제거해주세요.','깨지지 않도록 수거함에 조심해서 넣어주세요.']),
  brokenGlass:r('special','깨진 유리는 안전하게 따로 처리해요','지역 기준에 따른 종량제 봉투 또는 불연성 마대','깨진 유리는 유리병 재활용 대상이 아니며 지역·양에 따라 배출 방법이 달라요.',['다치지 않도록 두꺼운 종이 등으로 감싸주세요.','거주지에서 지정한 봉투·불연성 마대 기준을 확인해주세요.','포장 겉면에 깨진 유리가 들어 있음을 표시해주세요.'],'glass'),
  specialGlass:r('special','일반 유리병과 분리해서 배출해요','불연성 마대 또는 대형폐기물 등 지역 지정 방식','거울·도자기·내열 유리는 일반 유리병과 재질이 달라요.',['크기와 품목에 맞는 지자체 배출 방식을 확인해주세요.','깨지거나 날카로운 부분은 안전하게 감싸주세요.'],'law'),
  glassCheck:r('check','유리 제품의 종류를 확인해주세요','지자체 품목별 배출 안내','유리처럼 보여도 일반 유리병으로 재활용되지 않는 제품이 있어요.',['제품 용도와 재질을 확인한 뒤 지역 안내를 찾아주세요.']),
  deposit:r('special','빈용기 보증금 반환처에 반납해요','빈용기 보증금 반환처','보증금 표시가 있는 병은 반환 대상이에요.',['내용물을 비우고 병을 깨뜨리지 마세요.','보증금 표시를 확인한 뒤 반환처에 반납해주세요.']),
  metal:r('recycle','캔·고철류로 배출해요','캔·고철류 수거함','깨끗한 금속 캔과 수거 대상 생활용품은 금속류로 모아요.',['남은 내용물과 이물질을 제거해주세요.','지역의 캔·고철 수거 기준에 맞춰 배출해주세요.']),
  metalCheck:r('check','금속 제품의 처리 방법을 확인해요','지자체 품목별 배출 안내','오염·부속품·제품 용도에 따라 금속류로 수거하지 않을 수 있어요.',['제품명과 분리되지 않는 재질을 확인해주세요.','일반쓰레기·대형폐기물 등 해당 품목의 안내를 확인해주세요.'],'law'),
  chemical:r('special','잔여 내용물이 있는 용기는 별도 확인해요','지자체가 지정한 수거 방법','페인트·락카 등이 남아 있는 용기는 일반 캔과 다르게 처리해요.',['내용물을 배수구나 땅에 버리지 마세요.','용기 표시와 지자체 폐기물 담당 부서의 안내에 따라 배출해주세요.']),
  gas:r('special','가스 용기의 안전 배출 방법을 확인해요','제품 표시와 지자체가 지정한 수거 방법','잔여 가스가 있는 용기는 화재·폭발 위험을 고려해야 해요.',['제품에 표시된 잔여 가스 처리 방법을 먼저 확인해주세요.','가스가 남았거나 처리 여부를 모르겠다면 임의로 구멍을 뚫지 마세요.','지자체 안내에 따라 배출해주세요.']),
  foam:r('recycle','스티로폼류로 배출해요','스티로폼 지정 수거 장소','깨끗한 흰색 포장용 스티로폼은 별도 재활용 대상으로 모아요.',['내용물·테이프·송장 등 이물질을 제거해주세요.','흩어지지 않도록 모아 지정된 장소에 배출해주세요.']),
  battery:r('special','폐건전지 전용 수거함에 넣어요','폐건전지 전용 수거함','건전지는 일반쓰레기와 섞지 않고 따로 수거해요.',['공동주택·주민센터 등의 수거 가능 장소를 확인해주세요.'],'law'),
  lamp:r('special','폐형광등 전용 수거함에 넣어요','폐형광등 전용 수거함','온전한 폐형광등은 전용 수거 체계를 이용해요.',['깨지지 않게 포장·운반해주세요.','깨진 형광등은 전용함에 넣기 전에 지역 처리 기준을 확인해주세요.']),
  blanket:r('special','솜이불은 지역 수거 방법을 확인해요','대형폐기물 신고 또는 지역 지정 봉투','솜이불은 의류 수거 대상과 다르고 지역마다 처리 방식이 달라요.',['거주지에서 솜이불을 대형폐기물로 받는지 확인해주세요.','지역의 신고·수수료·봉투 기준에 따라 배출해주세요.'],'law'),
  cup:r('check','컵라면 용기의 재질부터 확인해요','재질별 수거함 또는 종량제 봉투','종이·플라스틱·스티로폼 용기는 같은 기준으로 판단할 수 없어요.',['용기의 재질 표시와 지자체 수거 기준을 확인해주세요.','씻어도 심한 오염이 남으면 일반쓰레기로 배출해주세요.','깨끗해도 해당 재질이 수거 대상인지 확인해주세요.']),
  unknown:r('check','판단이 어렵다면 확인 후 배출해요','제품의 재질 표시 · 거주지 배출 안내','현재 답변만으로 올바른 수거 방법을 확정하기 어려워요.',['제품의 재질 표시와 부속품·오염 상태를 확인해주세요.','공식 안내나 관리사무소·지자체에서 품목별 기준을 확인해주세요.'])
};
const q = (title,hint,yes,no) => ({title,hint,yes,no});
const TREES = {
  plastic: {
    q1:q('세척해도 음식물이나 이물질이 제거되지 않나요?','아직 씻지 않았다면 씻어서 제거할 수 있는지 기준으로 답해주세요.',['trash'],['q2']),
    q2:q('여러 재질이 섞여 있는 제품인가요?','금속·고무 등의 부속품을 확인해주세요. 페트병 라벨은 뒤에서 따로 물어봐요.',['q3'],['q4']),
    q3:q('플라스틱과 다른 재질을 분리할 수 있나요?','분리한 플라스틱 본체를 기준으로 이후 질문에 답해주세요.',['q4','플라스틱 본체에서 다른 재질의 부속품을 분리해주세요.'],['plasticCheck']),
    q4:q('무색·투명한 생수병이나 음료 페트병인가요?','색이 있는 병, 세제·식용유 용기, 일회용 컵은 해당하지 않아요.',['q5'],['q6']),
    q5:q('내용물을 비우고 라벨을 제거했나요?','라벨 없는 제품은 내용물을 비웠는지만 확인해주세요.',['pet'],['pet','내용물을 비우고 헹군 뒤 라벨을 제거해주세요.']),
    q6:q('플라스틱 용기나 포장재인가요?','음식·생활용품을 담는 용기·포장재인지 확인해주세요. 장난감·칫솔 등은 아니요를 선택해요.',['plastic'],['plasticCheck'])
  },
  vinyl: {
    q1:q('세척해도 음식물이나 이물질이 제거되지 않나요?','제거되지 않는 오염이 있는지 확인해주세요.',['trash'],['q2']),
    q2:q('비닐이 아닌 다른 재질이 붙어 있나요?','송장과 테이프는 뒤에서 따로 물어봐요.',['q3'],['q4']),
    q3:q('붙어 있는 다른 재질을 분리할 수 있나요?','분리되지 않는 혼합 제품인지 확인해주세요.',['q4','비닐에 붙은 다른 재질을 분리해주세요.'],['trash']),
    q4:q('택배 송장이나 테이프가 붙어 있나요?','제거되지 않는 이물질이 남으면 다음 질문에서 아니요를 선택해주세요.',['q5','택배 송장과 테이프를 제거해주세요.'],['q5']),
    q5:q('이물질을 제거한 깨끗한 비닐 포장재인가요?','은박 제품 등 수거 제외 품목은 공식 안내를 확인해주세요.',['vinyl'],['trash'])
  },
  paper: {
    q1:q('기름이나 음식물에 심하게 오염되었나요?','종이 섬유에 스며든 기름·음식물 얼룩을 확인해주세요.',['trash'],['q2']),
    q2:q('비닐이나 플라스틱 등으로 코팅되어 있나요?','단순 표면 인쇄와 다른 필름 코팅인지 확인해주세요. 판단이 어렵다면 모르겠어요를 선택해요.',['q3'],['q4']),
    q3:q('코팅된 부분을 분리할 수 있나요?','코팅을 벗긴 종이 부분의 상태를 이어서 확인해요.',['q4','코팅을 벗기고 종이 부분만 따로 모아주세요.'],['trash']),
    q4:q('종이가 물에 젖거나 곰팡이가 생겼나요?','물에만 젖은 경우와 오염된 경우를 결과에서 구분해드려요.',['wetPaper'],['q5']),
    q5:q('스프링이나 철심 등이 붙어 있나요?','노트의 스프링, 상자의 철핀 등을 확인해주세요.',['q6'],['q7']),
    q6:q('스프링이나 철심을 제거할 수 있나요?','제거한 종이의 종류를 이어서 확인해요.',['q7','스프링·철심 등 다른 재질의 부속품을 제거해주세요.'],['paperCheck']),
    q7:q('영수증처럼 감열지인가요?','열로 인쇄하는 영수증·전표가 대표적이에요.',['trash'],['q8']),
    q8:q('상자나 골판지 형태인가요?','배송 상자·골판지 상자 등이 해당해요.',['paper','상자의 테이프와 철핀을 제거하고 접어주세요.'],['paper'])
  },
  carton: {
    q1:q('내용물이 남아 있거나 오염되어 있나요?','팩 내부에 남은 우유·주스 등을 확인해주세요.',['q2'],['q3']),
    q2:q('내용물을 비우고 물로 헹굴 수 있나요?','헹궈도 제거되지 않는 오염이 있다면 아니요를 선택해요.',['q3','팩 안의 내용물을 비우고 깨끗이 헹궈주세요.'],['trash']),
    q3:q('우유팩·주스팩처럼 액체를 담았던 종이팩인가요?','우유·두유·주스 등의 일반팩과 멸균팩이 해당해요.',['q4'],['notCarton']),
    q4:q('빨대나 비닐 등 다른 재질이 붙어 있나요?','분리할 수 없는 부착물은 지역 수거 기준을 함께 확인해주세요.',['q5','빨대·비닐 등 분리 가능한 다른 재질을 제거해주세요.'],['q5']),
    q5:q('종이팩을 펼치거나 압착할 수 있나요?','수거하기 좋도록 부피를 줄여주세요.',['carton','종이팩을 펼치거나 납작하게 눌러주세요.'],['carton'])
  },
  glass: {
    q1:q('유리병 형태의 제품인가요?','음료·식품 등을 담았던 유리병인지 확인해주세요.',['q2'],['q3']),
    q2:q('깨지지 않고 온전한 상태인가요?','깨진 병은 유리병 수거함에 넣지 않아요.',['q4'],['brokenGlass']),
    q3:q('도자기·거울·내열 유리 제품인가요?','도자기 컵, 거울, 오븐용 유리그릇 등이 해당해요.',['specialGlass'],['glassCheck']),
    q4:q('병 안에 내용물이 남아 있나요?','담배꽁초 등 이물질도 확인해주세요.',['q5','병 안의 내용물을 비우고 헹궈주세요.'],['q5']),
    q5:q('플라스틱이나 금속 뚜껑이 붙어 있나요?','유리병과 다른 재질은 나눠 배출해요.',['q6','플라스틱·금속 뚜껑을 분리해주세요.'],['q6']),
    q6:q('빈용기 보증금 대상 표시가 있나요?','소주·맥주병이라도 보증금 표시를 확인해주세요.',['deposit'],['glass'])
  },
  metal: {
    q1:q('페인트나 락카 등 내용물이 남아 있나요?','화학 제품의 내용물이 남아 있는지 확인해주세요.',['chemical'],['q2']),
    q2:q('음식물이나 이물질이 묻어 있나요?','용기 내부와 표면을 확인해주세요.',['q3'],['q4']),
    q3:q('세척해서 이물질을 제거할 수 있나요?','세척할 수 없는 경우 품목별 확인이 필요해요.',['q4','금속에 묻은 음식물과 이물질을 세척해주세요.'],['metalCheck']),
    q4:q('플라스틱 등 다른 재질이 붙어 있나요?','손잡이·부속품 등 다른 재질을 확인해주세요.',['q5'],['q6']),
    q5:q('붙어 있는 다른 재질을 분리할 수 있나요?','분리한 금속 본체를 기준으로 다음 질문에 답해주세요.',['q6','금속에서 다른 재질의 부속품을 분리해주세요.'],['metalCheck']),
    q6:q('부탄가스·살충제처럼 가스가 들어 있던 용기인가요?','가스 용기는 일반 캔과 구분해 안내해요.',['gas'],['q7']),
    q7:q('금속으로 만들어진 캔이나 생활용품인가요?','금속이 아닌 제품이나 대상이 불분명하면 아니요를 선택해요.',['metal'],['metalCheck'])
  },
  foam: {
    q1:q('음식물이나 이물질이 묻어 있나요?','스티로폼 표면과 안쪽을 확인해주세요.',['q2'],['q3']),
    q2:q('세척해서 오염물을 제거할 수 있나요?','기름·음식물이 스며들어 제거되지 않는지 확인해주세요.',['q3','스티로폼의 오염물을 깨끗하게 세척해주세요.'],['trash']),
    q3:q('흰색 포장용 스티로폼인가요?','가전 포장재·흰색 상자 등이 해당해요. 컵라면 용기·과일망·보냉팩은 제외해요.',['q4'],['trash']),
    q4:q('테이프나 송장 등 이물질이 붙어 있나요?','스티로폼이 아닌 부착물을 확인해주세요.',['q5'],['foam']),
    q5:q('붙어 있는 이물질을 제거할 수 있나요?','이물질을 제거한 상태로 배출해야 해요.',['foam','테이프·송장 등 부착물을 제거해주세요.'],['trash'])
  }
};
const ITEMS = [
  ['칫솔','trash'],['영수증','trash'],['건전지','battery'],['볼펜','trash'],['솜이불','blanket'],
  ['컵라면 용기','cup'],['깨진 유리','brokenGlass'],['거울','specialGlass'],['도자기 컵','specialGlass'],
  ['물티슈','trash'],['마스크','trash'],['고무장갑','trash'],['사용한 휴지','trash'],
  ['내열 유리그릇','specialGlass'],['폐형광등','lamp']
];

const flow = document.querySelector('#flow');
const categoryName = document.querySelector('#category-name');
let category = null, current = null, history = [], itemName = '';
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labelFor = id => CATEGORIES.find(c => c[0] === id)?.[1] || '종류 선택';
function focusTitle() { flow.querySelector('h2').focus({preventScroll:true}); }
function addButton(container,label,action,className='') {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = label; button.className = className;
  button.addEventListener('click',action,{once:true});
  container.append(button); return button;
}
function renderHome(moveFocus=true) {
  category=null; current=null; history=[]; itemName='';
  categoryName.textContent='종류 선택';
  flow.innerHTML='<p class="eyebrow">01 / 종류 선택</p><h2 id="question-title" tabindex="-1">어떤 쓰레기를 버리나요?</h2><p class="hint">가장 가까운 종류를 선택해주세요.</p><div class="category-grid"></div>';
  const grid=flow.querySelector('.category-grid');
  CATEGORIES.forEach(([id,name,description],i) => {
    const button=addButton(grid,'',() => {
      category=id; categoryName.textContent=name;
      if(id==='confusing') renderItems();
      else {current='q1'; renderQuestion();}
    },'category-button');
    button.innerHTML=`<span class="category-number" aria-hidden="true">0${i+1}</span><span><strong>${name}</strong><small>${description}</small></span>`;
  });
  if(moveFocus) focusTitle();
}
function navigation() {
  const nav=document.createElement('nav'); nav.className='navigation'; nav.setAttribute('aria-label','질문 이동');
  addButton(nav,'← 이전 단계',back,'secondary');
  addButton(nav,'처음부터 다시',() => renderHome(),'secondary');
  flow.append(nav);
}
function renderItems() {
  current='items'; itemName='';
  flow.innerHTML='<p class="eyebrow">헷갈리는 쓰레기</p><h2 id="question-title" tabindex="-1">어떤 품목인가요?</h2><p class="hint">품목을 누르면 배출 방법을 바로 볼 수 있어요.</p><div class="item-grid"></div>';
  const grid=flow.querySelector('.item-grid');
  ITEMS.forEach(([name,target]) => addButton(grid,name,() => {itemName=name; current=target; renderResult();}));
  navigation(); focusTitle();
}
function remaining(id,tree) {
  if(!tree[id]) return 0;
  return 1+Math.max(remaining(tree[id].yes[0],tree),remaining(tree[id].no[0],tree));
}
function renderQuestion() {
  const tree=TREES[category], node=tree[current], total=history.length+remaining(current,tree), number=history.length+1;
  const path=history.map(entry => `${tree[entry.id].title} ${entry.answer==='yes'?'예':'아니요'}`);
  flow.innerHTML=`<div class="progress-label"><span>${labelFor(category)} 확인</span><span>${number}번째 질문 · 최대 ${total}개</span></div>
    <div class="progress" role="progressbar" aria-label="질문 진행" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${history.length}">${Array.from({length:total},(_,i)=>`<span class="${i<number?'active':''}"></span>`).join('')}</div>
    <h2 id="question-title" tabindex="-1">${node.title}</h2><p class="hint">${node.hint}</p><div class="choices"></div>
    ${path.length?`<details class="answer-path"><summary>지금까지 선택한 답 ${path.length}개</summary><ol>${path.map(text=>`<li>${escapeHtml(text)}</li>`).join('')}</ol></details>`:''}`;
  const choices=flow.querySelector('.choices');
  [['yes','예'],['no','아니요'],['unknown','모르겠어요']].forEach(([value,label]) => addButton(choices,label,() => {
    const edge=value==='unknown'?['unknown']:node[value];
    history.push({id:current,answer:value,preparation:edge[1]}); current=edge[0];
    if(tree[current]) renderQuestion(); else renderResult();
  },value==='unknown'?'uncertain':''));
  navigation(); focusTitle();
}
function getResult(id,path=[]) {
  const value=RESULTS[id];
  if(!value) throw new Error(`결과가 없습니다: ${id}`);
  const prep=value.kind==='trash'||value.kind==='check'?[]:path.map(entry=>entry.preparation).filter(Boolean);
  return {...value,steps:[...new Set([...prep,...value.steps])]};
}
function renderResult() {
  const value=getResult(current,history);
  const names={recycle:'재활용 쓰레기',trash:'일반쓰레기',special:'별도 배출',check:'확인 필요'};
  const verdict={recycle:'재활용 분리배출 가능',trash:'재활용 불가',special:'지정된 수거·처리 방법 이용',check:'현재 답변만으로 확정하기 어려워요'};
  const source=SOURCES[value.source];
  flow.innerHTML=`<p class="eyebrow">${escapeHtml(labelFor(category))}${itemName?` / ${escapeHtml(itemName)}`:''} · 결과</p>
    <span class="result-tag ${value.kind==='check'||value.kind==='special'?'review':''} ${value.kind==='trash'?'trash':''}">${names[value.kind]}</span>
    <h2 class="result-title" id="question-title" tabindex="-1">${value.title}</h2><p class="verdict">${verdict[value.kind]}</p>
    <div class="destination"><span>어디에 버리나요?</span><strong>${value.place}</strong></div>
    <h3 class="steps-title">배출 전 이렇게 해주세요</h3><ol class="steps">${value.steps.map(step=>`<li>${escapeHtml(step)}</li>`).join('')}</ol>
    <p class="result-note"><strong>판정 이유</strong><br>${value.reason}</p>
    <a class="result-source" href="${escapeHtml(source[1])}" target="_blank" rel="noopener noreferrer">근거: ${source[0]} ↗</a>
    <p class="hint result-local">지역별 봉투·수거함·요일 기준을 함께 확인해주세요.</p>`;
  navigation(); focusTitle();
}
function back() {
  if(category==='confusing') {
    if(current==='items') renderHome(); else renderItems();
  } else if(history.length) {
    current=history.pop().id; renderQuestion();
  } else renderHome();
}
renderHome(false);