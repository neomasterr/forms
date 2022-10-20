import ComponentElement from '@neomasterr/component-element';
import FormInputText from './form-inputs/text';
import {merge} from '@neomasterr/utils';

const defaultModules = {
    text: FormInputText,
};

/**
 * Компонент формы
 *
 * Предоставляет метод submit() для отправки формы, возвращает промис
 * Предоставляет события 'before:submit', 'submit'. Возврат true в любом из событий прерывает дальнейшее выполнение.
 *
 * @param {Element} $element HTML элемент
 * @param {Object}  options
 */
function Form($element, options = {}) {
    // наследование
    ComponentElement.call(this, $element, options);

    this.$element.addEventListener('input', this._onInputEvent.bind(this));
    this.$element.addEventListener('change', this._onChangeEvent.bind(this));
    this.$element.addEventListener('submit', this._onSubmitEvent.bind(this));
    this.$element.addEventListener('reset', this._onResetEvent.bind(this));
    this.$element.addEventListener('focusin', this._onFocusInEvent.bind(this));

    // нажатие ctrl + enter
    this.$element.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key == 'Enter') {
            this._onSubmitEvent(e);
        }
    });

    this.rules   = [];
    this.inputs  = [];
    this.modules = {};
    this.use(Object.assign({}, Form.__modules__, options.use));

    // поля с конкретным типом ввода
    this.$element.querySelectorAll('[data-form-input]').forEach($element => {
        this.inputs.push({
            type: $element.dataset.formInput,
            $element,
        });
    });

    // текстовые поля, без явно указанного типа ввода
    this.$element.querySelectorAll('input[type="text"], input[type="tel"], input[type="password"], input[type="email"], textarea').forEach($element => {
        const $parent = $element.closest('[data-form-input]');
        if ($parent) {
            return;
        }

        this.inputs.push({
            type: 'text',
            $element,
        });
    });

    // инициализация полей
    this.inputs.forEach(input => {
        if (!this.modules[input.type]) {
            return;
        }

        const {module, options = {}} = this.modules[input.type];
        input.module = new module(input.$element, options);

        input.module.onState('disabled', (disabled) => {
            this.validate();
        });
    });

    Object.defineProperty(this, 'changed', {
        get: this.getChanged.bind(this),
        set: this.setChanged.bind(this),
    });

    // инициализация правил валидации
    this.getDefaultRules().concat(this.options.rules).forEach(rule => {
        this.addRule(rule, false);
    });

    // инициализация
    this.setChanged(false);
    this.validate();
}

/**
 * Глобальное использование модулей
 * @param {Object} modules Модули {name: Function|Object}
 */
Form.use = function(modules) {
    if (!Form.__modules__) {
        Form.__modules__ = {};
    }

    Object.entries(modules).forEach(([name, module]) => {
        Form.__modules__[name] = module;
    });
}

// цепочка прототипов
Form.prototype = Object.create(ComponentElement.prototype);
Object.defineProperty(Form.prototype, 'constructor', {
    value: Form,
    writable: true,
    enumerable: false,
});

Form.prototype.setOptions = function(options) {
    return ComponentElement.prototype.setOptions.call(this, merge({
        use: {},
        rules: [],
    }, options));
}

/**
 * Правила валидации по умолчанию
 * @return {Array<Function>}
 */
Form.prototype.getDefaultRules = function() {
    return [
        () => {
            return this.inputs.every(input => input.module.disabled || input.module.validate());
        },
    ];
}

/**
 * Локальное использование модулей
 * @param {Object} modules Модули {name: Function|Object}
 */
Form.prototype.use = function(modules) {
    Object.entries(modules).forEach(([name, module]) => {
        if (typeof module == 'function') {
            this.modules[name] = {module};
        } else if (typeof module == 'object') {
            this.modules[name] = module;
        }
    });
}

Form.prototype._onInputEvent = function(e) {
    this.validate();
}

Form.prototype._onChangeEvent = function(e) {
    this.validate();
}

Form.prototype._onSubmitEvent = function(e) {
    e.preventDefault();
    this.submit();
}

Form.prototype._onResetEvent = function(e) {
    window.requestAnimationFrame(() => {
        const changeEvent = new CustomEvent('change', {
            bubbles: true,
            cancelable: true,
        });

        for (let i = 0; i < this.$element.elements.length; ++i) {
            this.$element.elements[i].dispatchEvent(changeEvent);
        }
    });
}

Form.prototype._onFocusInEvent = function(e) {
    this._lastActiveElement = e.target;
}

/**
 * Получение объекта элемента ввода (FormInput)
 * @param  {String}    name Имя поля
 * @return {FormInput|Array<FormInput>}
 */
Form.prototype.get = function(name) {
    const inputs = this.inputs.filter(input => {
        return input.module.getName() == name;
    }).map(input => input.module);

    return name.slice(-2) == '[]' ? inputs : inputs[0];
}

Form.prototype.getData = function() {
    return new FormData(this.$element);
}

/**
 * Блокировка формы от изменений пользователем
 * @return {Boolean} false если форма уже заблокирована
 */
Form.prototype.lock = function() {
    if (this.locked()) {
        return false;
    }

    this._disabledElements = [];

    this.$element.setAttribute('disabled', 'disabled');
    for (let i = 0; i < this.$element.elements.length; ++i) {
        const $input = this.$element.elements[i];
        if ($input.hasAttribute('disabled')) {
            continue;
        }

        if ($input.type == 'submit') {
            continue;
        }

        $input.setAttribute('disabled', 'disabled')
        this._disabledElements.push($input);
    }

    return true;
}

/**
 * Состояние блокировки
 * @return {Boolean} true если заблокирована
 */
Form.prototype.locked = function() {
    return this.$element.hasAttribute('disabled');
}

/**
 * Снятие блокировки формы
 * @return {Boolean} false если форма не заблокирована
 */
Form.prototype.unlock = function() {
    if (!this.locked()) {
        return false;
    }
    this._disabledElements.forEach($element => {
        $element.removeAttribute('disabled');
    });
    this.$element.removeAttribute('disabled');

    this._lastActiveElement && this._lastActiveElement.focus();

    return true;
}

/**
 * Отправка формы
 * @return {Promise}
 */
Form.prototype.submit = function(force = false) {
    if (this.locked()) {
        return Promise.reject({
            message: 'Форма уже отправляется'
        });
    }

    if (!this.validate()) {
        return Promise.reject({
            message: 'В форме присутствуют ошибки или не заполненные поля'
        });
    }

    // emit возвращает true в случае прерывания
    if (this.emit('before:submit')) {
        return;
    }

    // блокировка формы от изменений
    this.resetErrors();
    this.setChanged(false);
    const formData = this.getData();

    this.lock();

    return fetch(this.$element.getAttribute('action'), {
        method: this.$element.getAttribute('method'),
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
    })
    .then(response => response.json())
    .then(r => {
        if (r.status != 'ok') {
            if (this.emit('error', r) === undefined) {
                this.handleFieldsErrors(r);
                throw r;
            }

            return;
        }

        if (this.emit('submit', r) === undefined) {
            return r;
        }
    }).finally(() => {
        // разблокировка
        this.unlock();
    });
}

/**
 * Сброс значений формы
 */
Form.prototype.reset = function() {
    this.$element.reset();
    this.$element.dispatchEvent(new Event('reset', {
        bubbles: true,
        cancelable: true,
    }));
}

/**
 * Обработка ошибок
 * @param {Object} r Ответ сервера
 */
Form.prototype.handleFieldsErrors = function(r) {
    if (typeof r.fields == 'undefined') {
        return;
    }

    for (const field in r.fields) {
        const message = r.fields[field];
        const item = this.get(field);
        if (!item) {
            continue;
        }

        item.setError(message);
    }
}

/**
 * Сброс ошибок
 */
Form.prototype.resetErrors = function() {
    this.inputs.forEach(input => {
        input.module.resetError();
    });
}

/**
 * Сериализация формы. Метод используется лишь для определения изменений формы
 * @return {String} JSON
 */
Form.prototype.serialize = function() {
    const formData = new FormData(this.$element);
    const object = {};

    formData.forEach((value, key) => {
        if (key.substr(-2) == '[]') {
            if (typeof object[key] == 'undefined') {
                object[key] = [];
            }

            object[key].push(value);
        } else {
            object[key] = value;
        }
    });

    return JSON.stringify(object);
}

/**
 * Наличие изменений формы
 * @return {Boolean}
 */
Form.prototype.getChanged = function() {
    return this._serializedOld != this.serialize();
}

/**
 * Принудительная установка наличия изменений формы
 * @param {Boolean} state
 */
Form.prototype.setChanged = function(state) {
    return this._serializedOld = state ? '' : this.serialize();
}

/**
 * Валидация формы
 * @return {Boolean} true если данные валидны
 */
Form.prototype.validate = function() {
    const valid   = this.rules.every(fn => fn());
    const disable = !valid;

    this.getSubmitButtons().forEach($submit => {
        $submit.disabled = disable;
    });

    return valid;
}

/**
 * Массив элементов с типом 'submit'
 * @return {Array<HTMLElement>}
 */
Form.prototype.getSubmitButtons = function() {
    const result = [];

    for (let i = 0; i < this.$element.elements.length; ++i) {
        const $input = this.$element.elements[i];
        if ($input.type == 'submit') {
            result.push($input);
        }
    }

    return result;
}

/**
 * Добавление правила валидации
 * @param {Function} fn       Функция - валидатор, должна возвращать true если данные корректны
 * @param {Boolean}  validate Вызов валидации формы
 */
Form.prototype.addRule = function(fn, validate = true) {
    const count = this.rules.push(fn);
    validate && this.validate();

    return {
        remove: () => {
            this.rules.splice(count - 1, 1);
            this.validate();
        }
    }
}

Form.use(defaultModules);

export default Form;
